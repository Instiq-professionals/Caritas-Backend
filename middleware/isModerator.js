module.exports = function (req, res, next){

    if (req.user.role !== "Moderator") return res.status(403).json({
        status: 'Forbidden',
       message: 'Access denied.',
    });

    next();
};