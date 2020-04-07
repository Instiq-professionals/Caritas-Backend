module.exports = function (req, res, next){
    const superAdmin = req.user.role.includes("Super Admin");
    if (!superAdmin) return res.status(403).json({
        status: 'Forbidden',
       message: 'Access denied.',
    });
    
    next();
}; 