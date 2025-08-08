import mongoose from 'mongoose';
import app from './app';
import config from './app/config';

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    app.listen(config.port, () => {
      console.log(
        `\x1b[42m Example app listening on port ${config.port} \x1b[0m`
      );
    });
  } catch (error) {
    console.log(error);
  }
}

main().catch((err) => console.log(err));
