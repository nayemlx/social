var express = require('express');
var router = express.Router();
const upload=require('./multer')
const userModel=require('./users');
const localStrategy=require('passport-local')
const passport = require('passport');
const postModel = require('./post')
const fs = require('fs/promises');
const nodemailer = require('nodemailer');
/* GET home page. */
passport.use(new localStrategy(userModel.authenticate()));
router.get('/', function(req, res, next) {
  res.render('index',{dot:false});
});
router.get('/home',IsLogedin,async function(req, res, next) {
  let user = await userModel.findOne({username:req.session.passport.user});
  let users = await userModel.find();
  const posts = await postModel.find()

  res.render('Home',{user,users,posts,dot:true});
 
});


// router.post('/visit/:userid',async function(req, res, next) {
//   let user = await userModel.findOne({_id:req.params.userid}).populate('posts');
//   let userr = await userModel.findOne({_id:req.params.userid});
//   let am = await userModel.findOne({username:req.session.passport.user});
 
//   if (am._id.toString() !== userr._id.toString()) {
//     res.redirect('/visit')
//   }
//   else{
//     res.redirect('/profile');
//   }
  
// })
router.get('/dl',IsLogedin,function(req,res){
res.render('dl')
})
router.post('/delete-account/:userid',async function(req,res){

   const user = await userModel.findOneAndDelete({_id:req.params.userid});
   await fs .unlink('./public/images/uploads/'+user.profileImage)
   await fs .unlink('./public/images/uploads/'+user.profilecoverImage)  
   res.redirect('/logout')
})
router.get('/settings',IsLogedin,async function(req, res, next) {
  let user = await userModel.findOne({username:req.session.passport.user});
  res.render('settings',{user,dot:true});
});

router.get('/visit/:userid',IsLogedin,async function(req, res, next) {
  try {
    let user = await userModel.findOne({_id:req.params.userid}).populate('posts');
  let userr = await userModel.findOne({_id:req.params.userid});
  let am = await userModel.findOne({username:req.session.passport.user});
 
  if (am._id.toString() !== userr._id.toString()) {
    res.render('visit', { user, userr, am, dot: true });
  }
  else{
    res.redirect('/profile');
  }
  } catch (error) {
    res.redirect('/dl')
  }
  
  
})


router.get('/post', function(req, res, next) {
  res.render('post',{dot:true});
});
router.get('/login', function(req, res, next) {
  res.render('login',{dot:false});
});
router.get('/profile',IsLogedin,async function(req, res, next) {
  let user = await userModel
  .findOne({username:req.session.passport.user})
  .populate('posts');
  res.render('profile',{user,dot:true});
});

router.get('/welcome',IsLogedin,async function(req, res, next) {
  let user =await userModel.findOne({username:req.session.passport.user});
  res.render('welcome',{user,dot:false});
});

router.get('/users',async function(req, res, next) {
  let users =await userModel.find();
  res.render('users',{users,dot:true});
})
router.get('/update/:userid',IsLogedin,async function(req, res, next) {
  let user =await userModel.findOne({_id:req.params.userid});
  res.render('update',{user,dot:true});
});
router.post('/update/:userid',async function(req, res, next) {
  let  {bio,homeaddress} = req.body;
  const user =await userModel.findOneAndUpdate({_id:req.params.userid},{bio,homeaddress});
  res.redirect('/profile');
});

router.post('/delete/:userid',async function(req, res, next) {
  let user = await postModel.findOneAndDelete({_id:req.params.userid});
  await fs.unlink('./public/images/uploads/'+user.postImage)
  res.redirect('/profile');
})

  
router.post('/register', function(req, res, next) {
 
   try {
    const data = new userModel({
      username:req.body.username,
      email:req.body.email,
      
     })
    userModel.register(data,req.body.password)
   
    .then(function(){
     passport.authenticate('local')(req,res,function(){
       res.redirect('/profile');
     })
    })
   } catch (error) {
    console.log(error)
    res.redirect('/')
   }
  
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/",
  }),
  async (req, res) => {
    try {
      // Find the authenticated user
      const user = await userModel.findOne({ username: req.user.username });

      if (!user) {
        return res.status(404).send("User not found.");
      }

      // Configure Nodemailer
      const transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: 'nayem.mab2@gmail.com',
          pass: 'pjpszmjqwyrnxqlq',
        },
      });

      // Send email
      const info = await transport.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Account verification",
        html: `
          <h1>Login successful.</h1>
          <h3>Welcome to your Lockbook account</h3>
          <p>It's a pleasure to meet you, ${user.username}!</p>
          <img src="https://image.similarpng.com/very-thumbnail/2020/05/Solutions-website-logo-png.png" alt="avatar" width="450" height="400"/>
          <a href="http://192.168.0.106:3000/profile">Go to your profile</a>
        `,
      });

      console.log("Email sent:", info.response);

      // Redirect to the welcome page
      res.redirect("/welcome");
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).send("An error occurred.");
    }
  }
);

     

router.get('/logout',function(req,res,next){
  req.logout(function(err){
    if (err){
      return next(err);
    }
    res.redirect('/login')
  })
});
function IsLogedin(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect('/')
}

router.post('/fileupload',IsLogedin, upload.single('profileImage'),async function(req, res, next) {
 const user=await userModel.findOne({username:req.session.passport.user});
 user.profileImage=req.file.filename;
 await user.save();
 res.redirect('/profile')

});
router.post('/uploadpost',IsLogedin, upload.single('postImage'),async function(req, res, next) {
  try {
    const user=await userModel.findOne({username:req.session.passport.user});
  const post=await postModel.create({
    user:user._id,
    userImage:user.profileImage,
    userName:user.username,
    postImage:req.file.filename,
    Title:req.body.Title
  })
  user.posts.push(post._id)
  await user.save();
  res.redirect('/home')
  } catch (error) {
    res.redirect('/home')
  }
  
 
 });

router.post('/fileuploadCover',IsLogedin, upload.single('profilecoverImage'),async function(req, res, next) {
  const user=await userModel.findOne({username:req.session.passport.user});
  user.profilecoverImage=req.file.filename;
  await user.save();
  res.redirect('/profile')
 
 })


module.exports = router;
