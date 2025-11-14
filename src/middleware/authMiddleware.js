// Simple auth middleware that extracts user id from token or header
// Supports token format: "dummy-token-<id>" (used by current login)
module.exports.requireAuth = (req, res, next) => {
    try {
        // Look for Authorization: Bearer <token> OR x-access-token OR x-user-id
        let token = null;
        const authHeader =
            req.headers["authorization"] || req.headers["x-access-token"];
        if (authHeader && typeof authHeader === "string") {
            if (authHeader.startsWith("Bearer ")) {
                token = authHeader.slice(7).trim();
            } else {
                token = authHeader.trim();
            }
        }

        // If x-user-id header provided, prefer numeric id there
        if (!token && req.headers["x-user-id"]) {
            token = req.headers["x-user-id"];
        }

        let userId = null;
        if (token) {
            if (typeof token === "string" && token.startsWith("dummy-token-")) {
                const parts = token.split("dummy-token-");
                userId = parseInt(parts[1], 10);
            } else if (/^\d+$/.test(String(token))) {
                userId = parseInt(token, 10);
            }
        }

        if (!userId || Number.isNaN(userId)) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Unauthorized: missing or invalid token",
                });
        }

        req.user = { id: userId };
        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        return res
            .status(500)
            .json({ success: false, message: "Server auth error" });
    }
};
