module.exports = function (req, res, next){
    const vendor = req.user.role.includes("Vendor");
    if (!vendor) return res.status(403).json({
        status: 'Forbidden',
       message: 'Access denied.',
    });
    
    next();
}; 