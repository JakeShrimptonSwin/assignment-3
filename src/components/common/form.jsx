//Jake Shrimpton - This form takes URL input form the user and validates

import { useState } from "react";
import { Box, Button, TextField } from '@mui/material'

function URLForm({ Result }) {
    const [inputURL, setInputUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    //https://www.geeksforgeeks.org/computer-networks/maximum-length-of-a-url-in-different-browsers/
    const MAX_URL_LENGTH = 2048;

    //validate URL logic - does not check if its safe or not just if it is a valid URL
    const validateURL = (url) => {
        //if URL is empty
        if (!inputURL) {
            setError('Please enter a URL.')
            return false
        }
        if (url.trim().length > MAX_URL_LENGTH) {
            setError(`URL must be no longer than ${MAX_URL_LENGTH} characters.`);
            return false;
        }
        //remove Whitespace
        const trimmedURL = inputURL.trim();

        try {
            const normalisedURL = /^https?:\/\//i.test(trimmedURL)
                ? trimmedURL
                : `https://${trimmedURL}`;

            const parsedURL = new URL(normalisedURL);
            //only allows web based urls as this is phishing
            if (
                !['http:', 'https:'].includes(parsedURL.protocol) ||
                !parsedURL.hostname.includes('.')
            ) {
                setError('Please enter a valid Web URL.')
                return false;
            }
            //return true if above condition passes
            return true;
        }
        //if something fails
        catch {
            setError('Something went wrong.')
            return false;
        }
    };

    const handleSubmit = async (event) => {
        //stop page refresh on submit
        event.preventDefault();
        setError('');


        //validate URL
        if (!validateURL(inputURL)) {
            //error messages come from within validation to give accurate errors
            return
        }

        //set loading while stuff gets done
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://127.0.0.1:8000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: inputURL.trim() })
            });
            const data = await response.json();

            if (!response.ok) {
                const backendError = data.error;
                const detailMessage = backendError?.details
                    ?.map((detail) => detail.message)
                    .join(' ');
                throw new Error(
                    detailMessage ||
                    backendError?.message ||
                    'The backend could not analyse this URL.'
                );
            }

            Result(data);
        } catch (requestError) {
            setError(
                requestError instanceof TypeError
                    ? 'Could not connect to the backend. Make sure the API is running at http://127.0.0.1:8000.'
                    : requestError.message || 'Unable to analyse this URL.'
            );
        } finally {
            setLoading(false);
        }
    };



    //form rendering
    return (
        <Box
            component="form"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
                maxWidth: 500,
                mx: 'auto'
            }}
            onSubmit={handleSubmit}
        >
            <TextField
                variant='outlined'
                label='Enter URL'
                value={inputURL}
                onChange={(event) => {
                    setInputUrl(event.target.value);
                    setError('');
                }}
                error={Boolean(error)}
                helperText={error}
                placeholder="https://example.com"
                fullWidth
                slotProps={{
                    htmlInput: {
                        maxLength: MAX_URL_LENGTH
                    }
                }}
            />
            <Button
                variant='contained'
                type="submit"
                disabled={loading}
            >
                {loading ? 'Checking...' : 'Check URL'}
            </Button>
        </Box >
    );

}

export default URLForm;