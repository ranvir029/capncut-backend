const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt=require('bcrypt')
const postModel = require('./models/postData');
const userModel=require('./models/userData');
const jwt=require('jsonwebtoken');

app.use(cors({ origin: "https://capncut-new-update.vercel.app/", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const mongoose=require('mongoose');
const postData = require('./models/postData'); 
mongoose.connect("mongodb+srv://uk845816_db_user:Tqebj4wXPwQZe0cf@capncutcluster.zv3mcxb.mongodb.net/?retryWrites=true&w=majority&appName=CapnCutCluster");


// handle replies
app.post("/reply/:postId", verifyToken, async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  try {
    const post = await postModel.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const reply = { user: userId, text };
    post.replies.push(reply);
    await post.save();

    // populate user info for replies
    await post.populate("replies.user", "userName");

    res.json({ replies: post.replies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add reply" });
  }
});

// signup routes
app.post("/signUpData", async (req,res)=>{
     const{userName,email,password}=req.body;
     const existedUser= await userModel.findOne({email});
     if(existedUser){
       return res.status(400).json({
           message:"User already Existed"
       })
     }
     const hashedPassword=await bcrypt.hash(password,10);
     const userSignupData=new userModel({userName,password:hashedPassword,email})
     await userSignupData.save();
     try{
         res.status(201).json({
           message:"User is being Registered"
         })
     }
     catch(e){
          res.status(500).json({
               message:"User Not Registerd"
          })
     }
})

// login routes
app.post("/loginData",async(req,res)=>{
      try{
 const{email,password}=req.body;
     const checkUser=await userModel.findOne({email});
     if(!checkUser){
          return res.status(400).json({
                message:"user not Found"
          })
     }
    const isPasswordValid= await bcrypt.compare(password,checkUser.password);
    if(!isPasswordValid) {
       return res.status(401).json({
           message:"Invalid Password"
       })
    } 
      const token=jwt.sign({
              id:checkUser._id,
              email:checkUser.email
      },"secret");
  
      res.status(200).json({
            token,
            message:"Login successful! Feel free to post now"
      })
      }
      catch(e){
          console.log(e);
          res.status(500).json({
                message:"Internal Server Error"
          })
      }  
})

// creating middleware for protected routes
function verifyToken(req,res,next){
      const authHeader=req.headers['authorization'];

      const tokenVerify=authHeader && authHeader.split(' ')[1];
      if(!tokenVerify){
           return res.status(400).json({
                message:"token is Not Provided"
           })
      }
      jwt.verify(tokenVerify,"secret",(err,decoded)=>{
            if(err){
                return res.status(403).json({
                     message:" Invalid token "
                })
            }
          req.user={ id: decoded.id, email: decoded.email };
          next();
      })
}

app.get('/formData', async (req, res) => {
     try {
          const data = await postModel.find().populate('user','userName');
          res.status(200).json(data);
     }
     catch (e) {
          console.error(e);
          res.status(500).json({
                message:"Failed to fetch posts"
          })
     }
})
app.post("/formData",verifyToken,async (req, res) => {
     const { title, Description,image } = req.body;
     try {
           const PostData = new postModel({ title, Description,
               image,
           user:req.user.id
      });
     await PostData.save();
      const populatedPost = await PostData.populate('user','userName');
          res.status(201).json(populatedPost)
     }
     catch (e) {
           res.status(500).json({
                message:"Failed to create posts"
          })
          console.log(e);
     }
})

// handel the mypost part
app.get("/myPosts", verifyToken, async (req, res) => {
  try {
    const myPosts = await postModel.find({ user: req.user.id }); // just get posts
    res.json(myPosts);
  } catch (e) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// handel like count
 app.post("/like/:postId",verifyToken,async (req,res)=>{
      const{postId}=req.params;
      const userId=req.user.id
      try{
           const post=await postModel.findById(postId);
           if(!post) {
              return  res.status(404).json({
                      message:"Post not found"
                })
           }
           if(post.likes.includes(userId)){
          return res.status(400).json({
                message:"You already Like this Post"
          })
           }
         post.likes.push(userId);
         await post.save();
         res.json({
            likesCount:post.likes.length
         })  
      }
      catch(e){
           console.log(e);
           res.status(500).json({
                message:"Internal Server Error"
           })
      }
 })
app.listen(3000);
