const safePayload = (body = {}) => {
  return {
    name: body.name,
    email: body.email,
    studentNumber: body.studentNumber
  };
};

export { safePayload };
