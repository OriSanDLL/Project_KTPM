const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const e = require("express")
const dotenv = require("dotenv").config()
const Stripe = require('stripe')

const app = express()
app.use(cors())
app.use(express.json({limit : "10mb"}))

const PORT = process.env.PORT || 8080

// mongodb connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URL)
.then(()=>console.log("Connect to Database"))
.catch(()=>console.log(err))

//schema
const userSchema = mongoose.Schema({
    firstName : String,
    lastName : String,
    email : {
        type : String,
        unique : true,

    },
    password : String,
    confirmPassword : String,
    image : String,
})

//
const userModel = mongoose.model("user", userSchema)

// api
app.get("/",(req,res)=>{
    res.send("Server is running")
})

// Sign up
app.post("/signup", async (req, res) => {
    try {
      const result = await userModel.findOne({ email: req.body.email });
  
      if (result) {
        res.send({ message: "Email đã được sử dụng!!!", alert: false });
      } else {
        const data = userModel(req.body);
        await data.save();
  
        res.send({ message: "Đăng ký thành công!!!", alert: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

// api login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email: email, password: password });
        
        if (user) {
            console.log(user);
            const dataSend = {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                image: user.image,
            };
            console.log(dataSend);
            res.send({ message: "Đăng nhập thành công!!!", alert: true, data: dataSend });
        } else {
            res.status(401).send({ message: "Email hoặc Password không chính xác. Vui lòng nhập lại!!!", alert: false, retry: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


// product section

const schemaProduct = mongoose.Schema({
  name : String,
  category : String,
  image : String,
  price : String,
  description : String,
});

const productModel = mongoose.model("product", schemaProduct)


// save product in data
// api
app.post("/uploadProduct", async (req, res) => {
  // console.log(req.body)
  const data = await productModel(req.body)
  const datasave =  await data.save()
  res.send({message : " Upload Successfully"})
})

//
app.get("/product",async (req, res) => {
  const data = await productModel.find({})
  res.send(JSON.stringify(data))
})

/*******payment getWay */
console.log(process.env.STRIPE_SECRET_KEY)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post("/Checkout-payment", async (req, res) => {


  try {
    const parmas = {
      submit_type : 'pay',
      mode : 'payment',
      payment_method_types : ['card'],
      billing_address_collection : "auto",
      shipping_options : [{shipping_rate : "shr_1OEEKsIuDq0OtsQzUvIHy6Uv"}],

      line_items : req.body.map((item) => {
        return{
          price_data : {
            currency : "usd",
            product_data : {
              name : item.name,
              // images : [item.image]
            },
            unit_amount : item.price * 100,
          },
          adjustable_quantity : {
            enabled : true,
            minimum : 1,
          },
          quantity : item.qty
        }
      }),

      success_url : `${process.env.FRONTEND_URL}/success`,
      cancel_url : `${process.env.FRONTEND_URL}/cancel`,

    }
  
    const session = await stripe.checkout.sessions.create(parmas)
    // console.log(session)
    res.status(200).json(session.id)
  }
  catch (err) {
    res.status(err.statusCode || 500).json(err.message)
  }

})

// server is running
app.listen(PORT,()=>console.log("server is running at port : " + PORT))