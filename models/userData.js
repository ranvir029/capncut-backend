const mongoose=require('mongoose');
const UserModel=mongoose.Schema({
      userName:{
           required:true,
           type:String
      },
       email:{
           required:true,
           type:String
      },
       password:{
           required:true,
           type:String
      },
    
})

module.exports=mongoose.model("UserData",UserModel);