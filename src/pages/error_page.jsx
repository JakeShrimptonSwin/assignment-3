//Jake Shrimpton
//This page will show a an error occurs such that there is never a blank page.

import {Link} from 'react-router-dom'
import { Button } from '@mui/material';

function ErrorPage() {
  return (
    <div className="App-header">
      <h1>OOPS!</h1>
      <p>We Shouldnt Be here...</p>
      <Button
        component={Link}
        to="/"
        variant="contained"
        sx={{ mt: 2 }}
      >
        Return to Home
      </Button>
    </div>
  );
}

export default ErrorPage;