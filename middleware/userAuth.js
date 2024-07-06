module.exports = {
  isAuthenticated: (req, res, next) => {
      if (req.isAuthenticated()) {
        console.log('user is authenticated');
          return next();
      }
      console.log('user is not authenticated');
      if (req.xhr || req.headers['content-type'] === 'application/json') {
        res.status(401).json({ redirectUrl: '/signin' });
    } else {
        res.redirect('/signin');
    }
  }
};