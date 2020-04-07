module.exports = function (req, res, next){
    const volunteer = req.user.role.includes("Volunteer");
    if (!volunteer) return res.status(403).json({
        status: 'Forbidden',
       message: 'Access denied.',
    });
    
    next();
}; 