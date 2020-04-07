module.exports = function (req, res, next){
    const moderator = req.user.role.includes("Moderator");
    if (!moderator) return res.status(403).json({
        status: 'Forbidden',
       message: 'Access denied.',
    });
    
    next();
}; 