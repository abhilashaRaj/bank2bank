if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// 2iw9hsvBEQcKYbxO

// mongodb+srv://user1:<password>@cluster0.nnghv.mongodb.net/<dbname>?retryWrites=true&w=majority

const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const User = require('./models/user');
const Transaction = require('./models/transaction');
const MongoDBStore = require("connect-mongo")(session)
// const dbURL = process.env.DB_URL;
const dbURL = process.env.DB_URL || 'mongodb://localhost:27017/userInfo';



mongoose.connect(dbURL,
{useNewUrlParser: true,
useUnifiedTopology: true,
useCreateIndex:true,
useFindAndModify:false
})
.then(()=>{
  console.log('Mongo Connection open');
})
.catch(err =>{
  console.log("Mongo Connection Error");
  console.log(err);
});

const secret = process.env.SECRET || 'agoodsecret';


const store = new MongoDBStore({
  url : dbURL,
  secret,
  touchAfter:24*60*60
});

store.on('error',function(e){
  console.log('Session Error',e)
});

const sessionConfig = {
  store,
  name : "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie:{
    httpOnly: true,
    expires: Date.now()+1000*60*60*24*7,
    naxAge:1000*60*60*60*7
  }
}
app.use(session(sessionConfig));

app.use(express.static(path.join(__dirname, 'public')));
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));



app.get('/',(req,res)=>{
  res.render('home/home');
})

app.get('/users', async (req,res)=>{
     const users = await User.find({});
     res.render('users/index',{users});
})

app.get('/users/:id', async (req, res) =>{
  const { id } = req.params;
  const users = await User.findById(id);
  res.render('users/show',{users});
})

app.get('/transaction',(req,res)=>{
  res.render('transactions/transaction')
})

app.post('/transfer', async (req,res)=>{
  console.log(req.body);
  const transferFrom = req.body.transferFrom;
  const transferTo = req.body.transferTo;
  const amount = req.body.amount;



  await User.findOneAndUpdate({name: transferTo}, {$inc : {balance : amount }},{new: true})
   .then(data =>{
     console.log(data)
   })
   .catch(err =>{
     console.log(err)
   });

   await User.findOneAndUpdate({name:transferFrom},{$inc: {balance : -amount}},{new:true})
   .then(data =>{
     console.log(data)
   })
    .catch(err =>{
      console.log(err)
    });

  const newTransaction = new Transaction(req.body);
  await newTransaction.save();
  console.log(newTransaction);


  res.redirect('/transaction');
})

app.get('/viewTransactions', async (req,res)=>{
  const transactions = await Transaction.find({});
  console.log(transactions);
  res.render('transactions/viewTransactions',{transactions});
})


const port = process.env.PORT || 3000;
app.listen(port, ()=>{
  console.log(`Serving on ${port}`);
})
