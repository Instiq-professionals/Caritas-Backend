module.exports = function (req, res, next){
    const admin = req.user.role.includes("Admin");
    if (!admin) return res.status(403).json({
        status: 'Forbidden',
       message: 'Access denied.',
    });
    
    next();
}; 