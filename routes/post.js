const mongoose =require('mongoose');
 
const postSchema = mongoose.Schema({
  user:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  }],
  Title:String,
  postImage:String,
  userName:String,
  userImage:String
})
module.exports= mongoose.model('Post',postSchema)