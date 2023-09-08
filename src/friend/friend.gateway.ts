import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { User } from 'src/common/entities/user.entity';
import { UserSocketRepository } from 'src/repository/user-socket.repository';
import { Observer, UserState, UserStateRepository, userStateToString } from 'src/repository/user-state.repository';
import { FriendService } from './friend.service';
@WebSocketGateway({ cors: true })
export class FriendGateway extends Observer {
  constructor(
    private friendService: FriendService,
    private userStateRepository: UserStateRepository,
    private userSocketRepository: UserSocketRepository,
  ) {
    super();
    this.userStateRepository.registerObserver(this);
  }

  @WebSocketServer()
  server: Server;

  async update() {
    const changedUser: { id: number; state: UserState } = this.userStateRepository.getResentChangedUser();
    try {
      const friends: User[] = await this.friendService.getFollowersList(changedUser.id);
      for (const friend of friends) {
        const friendId = friend.id;
        const state: UserState = this.userStateRepository.find(friendId);
        if (state !== UserState.UNAVAIABLE) {
          const socket: string = this.userSocketRepository.find(friendId);
          this.server
            .to(socket)
            .emit('user-update', { id: changedUser.id, state: userStateToString(changedUser.state) });
        }
      }
    } catch (e) {
      console.log('update error~');
    }
  }
}
