import express from 'express';
import ejs from 'ejs';

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));

// Render the index page
app.get('/', (req, res) => {
  const data = {
    title: 'SSR Web',
    message: 'This is a dynamic message from the server'
  };
  res.render('index', data);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});