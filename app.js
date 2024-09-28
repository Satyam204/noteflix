require('dotenv').config();

const express=require('express');
const methodOverride = require('method-override');
const expressLayout = require('express-ejs-layouts');
const connectDB=require('./backend/server/db')
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app=express();
const PORT=process.env.PORT||5000;

connectDB();

app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(expressLayout);
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URL
    }),
  }));

app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.use('/', require('./backend/routes/main'));
app.use('/', require('./backend/routes/admin'));


app.listen(PORT,()=>
{
    console.log(`running on port  ${PORT}`);
})