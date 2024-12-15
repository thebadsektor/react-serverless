import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, TextField, Typography, Grid, Card, CardContent } from '@mui/material';
import { supabase } from './supabaseClient'; // Import Supabase client
import { useNavigate } from 'react-router-dom';

const SupabaseSignInForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    const { email, password } = data;
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setErrorMessage('Something went wrong!');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Sign In</Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                {...register('email', { required: 'Email is required' })}
                error={!!errors.email}
                helperText={errors.email?.message as string}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                {...register('password', { required: 'Password is required' })}
                error={!!errors.password}
                helperText={errors.password?.message as string}
              />
            </Grid>
            {errorMessage && (
              <Grid item xs={12}>
                <Typography color="error">{errorMessage}</Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
              >
                Sign In
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default SupabaseSignInForm;
