

function isAuthenticated(req, res, next) {
    if (req.session && req.session.userid) {
        return next();
    } else {
        res.status(301).redirect('/admin')
    }
}

function isNotAuthenticated(req, res, next) {
    if (!req.session && !req.session.userid) {
        res.status(301).redirect('/admin')
    } else {
        return next();
    }
}
module.exports = {isAuthenticated,isNotAuthenticated};

