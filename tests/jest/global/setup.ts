import currUser from '../../data/curr-user';
import userFactory from '../../factories/user-factory';

async function globalSetup() {
  await currUser.insert();

  await userFactory.createManyAndSave({
    count: 100,
  });
}

export default globalSetup;
