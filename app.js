const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt=require('bcrypt')
const postModel = require('./models/postData');
const userModel=require('./models/userData');
const jwt=require('jsonwebtoken');
const passport = require("./config/passport");
const session = require("express-session");

app.use(cors({
  origin: "https://www.capncut.io", // Production frontend
  credentials: true
}));


app.use(session({
  secret: "some_secret_key",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());
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

// google auth
// Start Google OAuth
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback after login
app.get("/auth/google/callback",
  passport.authenticate("google",{ failureRedirect: "/" }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      "secret",
      { expiresIn: "1h" }
    );
    // Redirect to React frontend with token
  res.redirect(`https://www.capncut.io?token=${token}`);
  }
);


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

// // GET /profile/:username
// app.get("/profile/:username", async (req, res) => {
//   const user = await userModel.findOne({ userName: req.params.username }).select("-password");
// const socialLinks = Array.isArray(user.socialLinks) 
//     ? user.socialLinks 
//     : (user.socialLinks ? user.socialLinks.split(',') : []);
// const posts = await postModel.find({ user: user._id }).populate("user", "userName email");
// res.json({ user: { ...user.toObject(), socialLinks }, posts });

// });

// updateMyprofile section
app.put("/updateProfile", verifyToken, async (req, res) => {
  try {
    const { userName, socialLinks } = req.body;

    const updated = await userModel.findByIdAndUpdate(
      req.user.id,
      {
        ...(userName && { userName }),
        ...(socialLinks && { socialLinks }),
      },
      { new: true }
    );

    res.json({ message: "Profile updated successfully", user: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



// handel the mypost part
app.get("/myPosts", verifyToken, async (req, res) => {
  try {
    const myPosts = await postModel.find({ user: req.user.id }); // just get posts
    res.json(myPosts);
  } catch (e) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// /myprofileData
app.get("/myprofileData", verifyToken, async (req, res) => {
  try {
    const userProfileData = await userModel.findById(req.user.id).select("-password");
    const socialLinks = Array.isArray(userProfileData.socialLinks)
      ? userProfileData.socialLinks
      : (userProfileData.socialLinks ? userProfileData.socialLinks.split(",") : []);
    res.json({ ...userProfileData.toObject(), socialLinks });
  } catch (e) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// /profile/:username
app.get("/profile/:username", async (req, res) => {
  try {
    const user = await userModel.findOne({ userName: req.params.username }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const socialLinks = Array.isArray(user.socialLinks)
      ? user.socialLinks
      : (user.socialLinks ? user.socialLinks.split(",") : []);

    const posts = await postModel.find({ user: user._id }).populate("user", "userName email");

    res.json({ user: { ...user.toObject(), socialLinks }, posts });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
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
