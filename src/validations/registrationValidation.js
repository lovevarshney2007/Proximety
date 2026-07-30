import Joi from "joi";

const registrationValidation = Joi.object({
  name: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[A-Za-z ]+$/)
    .required()
    .messages({
      "string.empty": "Name is required",
      "string.pattern.base": "Name must contain only alphabets and spaces",
      "string.min": "Name must be at least 3 characters long",
      "string.max": "Name must be at most 30 characters long",
    }),

  studentNumber: Joi.string()
    .pattern(/^25[0-9]{5,6}$/) 
    
    .required()
    .messages({
      "string.pattern.base": "Student ID must start with 25 and be 7–8 digits long",
      "string.empty": "Student ID is required",
    }),

  email: Joi.string()
    .email()
    .pattern(/@akgec\.ac\.in$/)
    .required()
    .messages({
      "string.email": "Invalid email format",
      "string.pattern.base":
        "Use your official college email ID (@akgec.ac.in)",
      "string.empty": "Email is required",
    }),

  gender: Joi.string().valid("Male", "Female").required().messages({
    "any.only": "Gender must be either Male or Female",
    "string.empty": "Gender is required",
  }),

  branch: Joi.string()
    .valid(
      "CSE",
      "CSE(AIML)",
      "CSE(DS)",
      "CSE(H)",
      "CS",
      "IT",
      "CSIT",
      "AIML",
      "ECE",
      "EN",
      "ME",
      "Civil",
    )
    .required()
    .messages({
      "any.only": "Invalid branch selection",
      "string.empty": "Branch is required",
    }),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Enter a valid 10-digit mobile number",
      "string.empty": "Phone number is required",
    }),

  unstopId: Joi.string()
    .optional()
    .allow('',null)
    .messages({
      "string.pattern.base":
        "Unstop ID can contain only letters, numbers, dot and underscore",
      "string.empty": "Unstop ID is required",
    }),

  residence: Joi.string()
    .valid("Hosteller", "Day Scholar")
    .required()
    .messages({
      "any.only": "Residence must be either Hosteller or Day Scholar",
      "string.empty": "Residence is required",
    }),

  // captchaToken: Joi.string().required().messages({
  //   "string.empty": "Captcha token is required",
  // }),

  domain: Joi.string()
    .valid("frontend development", "backend development", "ml", "app", "designing", "managerial")
    .required()
    .messages({
      "any.only": "Invalid domain selection",
      "string.empty": "Domain is required",
    }),

  githubId: Joi.string()
    .optional()
    .allow('', null)
    .messages({
      "string.empty": "GitHub ID cannot be empty if provided",
    }),

  hackerrankId: Joi.string().required().messages({
    "string.empty": "HackerRank ID is required",
  }),
});

const sendOtpValidation = Joi.object({
  name: registrationValidation.extract("name"),
  email: registrationValidation.extract("email"),
  studentNumber: registrationValidation.extract("studentNumber"),
  captchaToken: Joi.string().allow('', null).optional(),
  gender: Joi.string().valid("Male", "Female").optional(),
  residence: Joi.string().valid("Hosteller", "Day Scholar").optional(),
});

export { registrationValidation, sendOtpValidation };
