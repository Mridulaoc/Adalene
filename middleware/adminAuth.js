

function isAdminAuthenticated(req, res, next) {
    if (req.session && req.session.userid) {
        return next();
    } else {
        res.status(301).redirect('/admin')
    }
}

function isNotAuthenticated(req, res, next) {
    if (!req.session || !req.session.userid) {
        return next();
        
    } else {
        res.status(301).redirect('/admin/dashboard')
    }
}
module.exports = {isAdminAuthenticated,isNotAuthenticated};

