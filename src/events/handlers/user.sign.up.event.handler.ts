import { DomainEvent, IEventHandler } from '../event.types';
import { UserSignUpPayload } from '../event.domain.types';
import { logger } from '../../logger/logger';

///////////////////////////////////////////////////////////////////////////////

export class UserSignUpEventHandler implements IEventHandler {

    topics = ['UserSignUp'];

    async handle(event: DomainEvent<UserSignUpPayload>): Promise<void> {
        logger.info(`Handling UserSignUp event: ${event.id}`);
        const payload = event.payload;

        // TODO: Use payload.USerId: uuid ? User id

        // TODO: Implement handler logic here
    }

}
