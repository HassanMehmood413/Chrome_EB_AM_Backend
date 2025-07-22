import User from '../../models/user.js';

const UpdateUserStatus = async ({
  userId,
  status
}) => {
  await User.updateOne({
    _id: userId
  }, {
    $set: {
      status
    }
  });
};

export default UpdateUserStatus;
