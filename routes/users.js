const  mongoose =require('mongoose');
const plm = require('passport-local-mongoose')
mongoose.connect(process.env.MONGO_URI);
const userSchema = new mongoose.Schema({
  username:{
    type:String,
    required:true
  },
  email:{
    type:String,

   
  },
  password:{
    type:String
  },
  profileImage:String,
  profilecoverImage:String,
  bio:String,
  homeaddress:String,
  posts:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Post'
  }]
});
userSchema.plugin(plm)
module.exports = mongoose.model('User',userSchema);
