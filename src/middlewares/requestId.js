import crypto from "crypto";

const requestId = (req,res,next) => {
    const incomingId = req.headers["x-request-id"];

    req.id = incomingId || crypto.randomUUID();

    res.setHeader("X-Request-Id", req.id);

    next();
}

export default requestId;