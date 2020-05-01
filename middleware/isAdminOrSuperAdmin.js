module.exports = function (req, res, next){
    const superAdmin = req.user.role.includes("Super Admin");
    const admin = req.user.role.includes("Admin");

    if (!superAdmin && !admin) return res.status(403).json({
        status: 'Forbidden',
       message: 'Access denied.',
    });
    
    next();
}; 