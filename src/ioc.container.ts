import { Container } from 'inversify';
import { TenantServiceInterface, TenantService, TenantServiceType } from './services/tenant.service';
import { StorageServiceType, StorageService, RedisService } from './services/storage.service';
import { KeyServiceType, KeyServiceInterface, KeyService } from './services/key.service';
import { JWTServiceInterface, JWTServiceType, JWTService } from './services/jwt.service';
import { JWTController } from './controllers/jwt.controller';
import { TenantController } from './controllers/tenant.controller';
import { UserController } from './controllers/user.controller';
import { interfaces, TYPE } from 'inversify-express-utils';
import { UserService, UserServiceInterface, UserServiceType } from './services/user.service';
import { Auth } from './middlewares/auth';
import config from './config';
import * as express from 'express';
import * as validation from './middlewares/request.validation';
import IpWhiteListFilter from './middlewares/ip.whitelist';

let container = new Container();
// let storage = new RedisService();

// services
container.bind<KeyServiceInterface>(KeyServiceType).to(KeyService);
container.bind<JWTServiceInterface>(JWTServiceType).to(JWTService);
container.bind<StorageService>(StorageServiceType).to(RedisService).inSingletonScope();
container.bind<TenantServiceInterface>(TenantServiceType).to(TenantService);
container.bind<UserServiceInterface>(UserServiceType).to(UserService);

// middlewares
const auth = new Auth(container.get<KeyServiceInterface>(KeyServiceType));
container.bind<express.RequestHandler>('AuthMiddleware').toConstantValue(
  (req: any, res: any, next: any) => auth.authenticate(req, res, next)
);
container.bind<express.RequestHandler>('CreateUserValidation').toConstantValue(
  (req: any, res: any, next: any) => validation.createUser(req, res, next)
);
container.bind<express.RequestHandler>('CreateTenantValidation').toConstantValue(
  (req: any, res: any, next: any) => validation.createTenant(req, res, next)
);
container.bind<express.RequestHandler>('LoginTenantValidation').toConstantValue(
  (req: any, res: any, next: any) => validation.loginTenant(req, res, next)
);
container.bind<express.RequestHandler>('CreateTokenValidation').toConstantValue(
  (req: any, res: any, next: any) => validation.createToken(req, res, next)
);
container.bind<express.RequestHandler>('TokenRequiredValidation').toConstantValue(
  (req: any, res: any, next: any) => validation.tokenRequired(req, res, next)
);
container.bind<express.RequestHandler>('TenantIpWhiteList').toConstantValue(
  (req: any, res: any, next: any) => (new IpWhiteListFilter(config.tenant.whitelist)).filter(req, res, next)
);

// controllers
container.bind<interfaces.Controller>(TYPE.Controller).to(JWTController).whenTargetNamed('JWTController');
container.bind<interfaces.Controller>(TYPE.Controller).to(TenantController).whenTargetNamed('TenantController');
container.bind<interfaces.Controller>(TYPE.Controller).to(UserController).whenTargetNamed('UserController');

export { container };
