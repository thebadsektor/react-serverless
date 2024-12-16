import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import supabaseAuthConfig from './supabaseAuthConfig';

export const SupabaseAuthContext = createContext(null);

const SupabaseAuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const getInitialSession = async () => {
			const { data: { session } } = await supabase.auth.getSession();
			setUser(session?.user || null);
			setIsLoading(false);
		};
		
		getInitialSession();
	}, []);

	const signIn = async (email, password) => {
		const { data: { user }, error } = await supabase.auth.signInWithPassword({ 
			email, 
			password 
		});
		if (error) throw error;
		setUser(user);
	};

	const signOut = async () => {
		await supabase.auth.signOut();
		setUser(null);
	};

	return (
		<SupabaseAuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
			{children}
		</SupabaseAuthContext.Provider>
	);
};

export default SupabaseAuthProvider;
