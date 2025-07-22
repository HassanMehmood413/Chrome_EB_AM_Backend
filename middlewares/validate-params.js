import Joi from 'joi';

const validateParams = paramSchema => async (req, res, next) => {
  const schema = Joi.object(paramSchema);
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message
    });
  }
  next();
};

export default validateParams;
