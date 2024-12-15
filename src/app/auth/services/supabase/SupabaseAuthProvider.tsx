import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import { PartialDeep } from 'type-fest';
import { User } from '../../user';
import { supabase } from './supabaseClient';
import UserModel from '../../user/models/UserModel';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type SupabaseAuthStatus = 'configuring' | 'authenticated' | 'unauthenticated';

export type SignInPayload = {
	email: string;
	password: string;
};

export type SignUpPayload = {
	displayName: string;
	password: string;
	email: string;
};

export type SupabaseAuthContextType = {
	user?: User;
	updateUser: (U: User) => void;
	signIn?: (credentials: SignInPayload) => Promise<User | Error>;
	signUp?: (U: SignUpPayload) => Promise<User | Error>;
	signOut?: () => void;
	isAuthenticated: boolean;
	isLoading: boolean;
	setIsLoading?: (T: boolean) => void;
	authStatus: SupabaseAuthStatus;
};

const defaultAuthContext: SupabaseAuthContextType = {
	isAuthenticated: false,
	isLoading: false,
	user: null,
	updateUser: null,
	signIn: null,
	signUp: null,
	signOut: null,
	setIsLoading: () => {},
	authStatus: 'configuring'
};

export const SupabaseAuthContext = createContext<SupabaseAuthContextType>(defaultAuthContext);

export type SupabaseAuthProviderProps = {
	children: React.ReactNode;
};

function SupabaseAuthProvider(props: SupabaseAuthProviderProps) {
	const [user, setUser] = useState<User>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [authStatus, setAuthStatus] = useState<SupabaseAuthStatus>('configuring');

	const { children } = props;

	const handleAuthSuccess = useCallback((userData: User) => {
		setIsAuthenticated(true);
		setUser(userData);
		setAuthStatus('authenticated');
	}, []);

	const handleAuthFailure = useCallback(() => {
		setIsAuthenticated(false);
		setUser(null);
		setAuthStatus('unauthenticated');
	}, []);

	const signIn = useCallback(async (credentials: SignInPayload) => {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: credentials.email,
				password: credentials.password
			});

			if (error) throw error;

			const userData = UserModel({
				uid: data.user.id,
				data: {
					displayName: data.user.email?.split('@')[0] || 'User',
					email: data.user.email,
					photoURL: ''
				},
				role: ['admin']
			});

			handleAuthSuccess(userData);
			return userData;
		} catch (error) {
			handleAuthFailure();
			return error as Error;
		}
	}, []);

	const signOut = useCallback(async () => {
		try {
			await supabase.auth.signOut();
			handleAuthFailure();
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}, []);

	const updateUser = useCallback(async (userData: PartialDeep<User>) => {
		try {
			setUser(userData as User);
			return null;
		} catch (error) {
			return error as AxiosError;
		}
	}, []);

	// Check auth state on mount
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const { data: { session } } = await supabase.auth.getSession();
				
				if (session?.user) {
					const userData = UserModel({
						uid: session.user.id,
						data: {
							displayName: session.user.email?.split('@')[0] || 'User',
							email: session.user.email,
							photoURL: ''
						},
						role: ['admin']
					});
					handleAuthSuccess(userData);
				} else {
					handleAuthFailure();
				}
			} catch (error) {
				handleAuthFailure();
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();

		const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === 'SIGNED_OUT') {
				handleAuthFailure();
			} else if (session?.user) {
				const userData = UserModel({
					uid: session.user.id,
					data: {
						displayName: session.user.email?.split('@')[0] || 'User',
						email: session.user.email,
						photoURL: ''
					},
					role: ['admin']
				});
				handleAuthSuccess(userData);
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const authContextValue = useMemo(
		() =>
			({
				user,
				isAuthenticated,
				authStatus,
				isLoading,
				signIn,
				signOut,
				updateUser,
				setIsLoading
			}) as SupabaseAuthContextType,
		[user, isAuthenticated, isLoading, signIn, signOut, updateUser]
	);

	return <SupabaseAuthContext.Provider value={authContextValue}>{children}</SupabaseAuthContext.Provider>;
}

export default SupabaseAuthProvider;
