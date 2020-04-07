module.exports = function (req, res, next){

    if (req.user.role !== "Volunteer") return res.status(403).json({
        status: 'Forbidden',
       message: 'Access denied.',
    });

    next();
};