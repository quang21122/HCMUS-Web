import express from 'express';  
import ejs from 'ejs';
import createDb from './config/db.js';
import articleRoute from './routes/articleRoute.js';
import userRoute from './routes/userRoute.js'

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Connect to the database
createDb();

// Serve static files
app.use(express.static('public'));
app.use(express.json());

app.use('/api/articles', articleRoute);
app.use('/api/users', userRoute);


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