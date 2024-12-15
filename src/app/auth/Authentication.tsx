import BrowserRouter from '@fuse/core/BrowserRouter';
import FuseAuthorization from '@fuse/core/FuseAuthorization/FuseAuthorization';
import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import { useAppDispatch, useAppSelector } from 'app/store/hooks';
import FuseSplashScreen from '@fuse/core/FuseSplashScreen/FuseSplashScreen';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from '@aws-amplify/auth';
import { resetUser, selectUserRole, setUser } from './user/store/userSlice';
import useAuth from './useAuth';
import UserModel from './user/models/UserModel';
import { User } from './user';
import useJwtAuth from './services/jwt/useJwtAuth';
import useFirebaseAuth from './services/firebase/useFirebaseAuth';
import { AuthContext } from './AuthenticationProvider';
import { supabase } from './services/supabase/supabaseClient';

type AuthenticationProps = {
	children: React.ReactNode;
};

function Authentication(props: AuthenticationProps) {
	const { children } = props;
	const { setAuthProvider, resetAuthProvider } = useAuth();
	const { setIsAuthenticated } = useContext(AuthContext);

	const userRole = useAppSelector(selectUserRole);
	const dispatch = useAppDispatch();

	/**
	 * Auth Providers
	 */

	/**
	 * Amplify Auth
	 */
	const { user: amplifyUser, authStatus: amplifyAuthStatus } = useAuthenticator();

	/**
	 * JWT Auth
	 */
	const { user: jwtUser, authStatus: jwtAuthStatus } = useJwtAuth();

	/**
	 * Firebase Auth
	 */
	const { user: firebaseUser, authStatus: firebaseAuthStatus } = useFirebaseAuth();

	/**
	 * Supabase Auth
	 */
	const [supabaseAuthStatus, setSupabaseAuthStatus] = useState<'configuring' | 'authenticated' | 'unauthenticated'>('configuring');

	/**
	 * isLoading
	 */
	const [isLoading, setIsLoading] = useState(true);

	/**
	 * Check if services is in loading state
	 */
	const inProgress = useMemo(
		() =>
			amplifyAuthStatus === 'configuring' ||
			jwtAuthStatus === 'configuring' ||
			firebaseAuthStatus === 'configuring' ||
			supabaseAuthStatus === 'configuring',
		[amplifyAuthStatus, jwtAuthStatus, firebaseAuthStatus, supabaseAuthStatus]
	);

	/**
	 * Any user is authenticated
	 */
	const authenticated = useMemo(
		() =>
			amplifyAuthStatus === 'authenticated' ||
			jwtAuthStatus === 'authenticated' ||
			firebaseAuthStatus === 'authenticated' ||
			supabaseAuthStatus === 'authenticated',
		[amplifyAuthStatus, jwtAuthStatus, firebaseAuthStatus, supabaseAuthStatus]
	);

	/**
	 * All users are unauthenticated
	 */
	const unAuthenticated = useMemo(
		() =>
			amplifyAuthStatus === 'unauthenticated' &&
			jwtAuthStatus === 'unauthenticated' &&
			firebaseAuthStatus === 'unauthenticated' &&
			supabaseAuthStatus === 'unauthenticated',
		[amplifyAuthStatus, jwtAuthStatus, firebaseAuthStatus, supabaseAuthStatus]
	);

	/**
	 * Sign Out
	 */
	useEffect(() => {
		if (!inProgress && unAuthenticated) {
			handleSignOut();
		}
	}, [inProgress, authenticated]);

	/**
	 * Loading state is false when all services are done loading
	 */
	useEffect(() => {
		if (!inProgress && !authenticated) {
			setIsLoading(false);
		}
	}, [inProgress, authenticated]);

	/**
	 * Handle sign in
	 */
	const handleSignIn = useCallback((provider: string, userState: User) => {
		dispatch(setUser(userState)).then(() => {
			setAuthProvider(provider);
			setIsLoading(false);
		});
	}, []);

	/**
	 * Handle sign out
	 */
	const handleSignOut = useCallback(() => {
		dispatch(resetUser());
		resetAuthProvider();
	}, []);

	/**
	 * Handle Sign In on load
	 */
	useEffect(() => {
		if (inProgress || !authenticated) {
			return;
		}

		if (amplifyUser) {
			fetchUserAttributes()
				.then((userAttributes) => {
					handleSignIn(
						'amplify',
						UserModel({
							uid: amplifyUser.userId,
							data: {
								displayName: userAttributes?.name,
								email: userAttributes?.email
							},
							role: ['admin']
						})
					);
				})
				.catch((err) => {
					console.error(err);
				});
		}

		if (jwtUser) {
			handleSignIn('jwt', jwtUser);
		}

		if (firebaseUser) {
			handleSignIn(
				'firebase',
				UserModel({
					uid: firebaseUser.uid,
					data: firebaseUser.data,
					role: ['admin']
				})
			);
		}
	}, [inProgress, authenticated, amplifyUser, jwtUser, firebaseUser, isLoading]);

	/**
	 * Check initial auth state
	 */
	useEffect(() => {
		const checkAuth = async () => {
			const { data: { session } } = await supabase.auth.getSession();
			if (session?.user) {
				handleSignIn(
					'supabase',
					UserModel({
						uid: session.user.id,
						data: {
							displayName: session.user.email?.split('@')[0] || 'User',
							email: session.user.email,
							photoURL: ''
						},
						role: ['admin']
					})
				);
				setSupabaseAuthStatus('authenticated');
			} else {
				setSupabaseAuthStatus('unauthenticated');
			}
			setIsLoading(false);
		};
		
		checkAuth();

		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
			if (session?.user) {
				handleSignIn(
					'supabase',
					UserModel({
						uid: session.user.id,
						data: {
							displayName: session.user.email?.split('@')[0] || 'User',
							email: session.user.email,
							photoURL: ''
						},
						role: ['admin']
					})
				);
				setSupabaseAuthStatus('authenticated');
			} else {
				setSupabaseAuthStatus('unauthenticated');
				handleSignOut();
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	return useMemo(
		() =>
			isLoading ? (
				<FuseSplashScreen />
			) : (
				<BrowserRouter>
					<FuseAuthorization userRole={userRole}>{children}</FuseAuthorization>
				</BrowserRouter>
			),
		[userRole, children, isLoading]
	);
}

export default Authentication;
