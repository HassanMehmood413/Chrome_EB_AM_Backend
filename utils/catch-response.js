const catchResponse = ({
  res,
  err
}) => {
  console.log({
    err
  });

  let statusCode = 500;
  let message = 'Server Error';

  if (err.statusCode) {
    ({ statusCode } = err);
  }

  if (err.message) {
    ({ message } = err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

export default catchResponse;
