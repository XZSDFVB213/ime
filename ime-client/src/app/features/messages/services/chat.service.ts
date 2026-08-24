import {
  inject,
  Injectable,
} from '@angular/core';

import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import {
  environment,
} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http =
    inject(HttpClient);

  getMe() {
    return this.http.get<any>(
      `${environment.api}/auth/me`,
    );
  }

  getChats() {
    return this.http.get<any[]>(
      `${environment.api}/chats`,
    );
  }

  getContacts(
    search?: string,
  ) {
    let params =
      new HttpParams();

    if (search?.trim()) {
      params = params.set(
        'search',
        search.trim(),
      );
    }

    return this.http.get<any[]>(
      `${environment.api}/chats/contacts`,
      {
        params,
      },
    );
  }

  createDirectChat(
    userId: string,
  ) {
    return this.http.post<any>(
      `${environment.api}/chats/direct/${userId}`,
      {},
    );
  }

  getMessages(
    chatId: string,
  ) {
    return this.http.get<any[]>(
      `${environment.api}/chats/${chatId}/messages`,
    );
  }

  sendMessage(
    chatId: string,
    text: string,
  ) {
    return this.http.post<any>(
      `${environment.api}/chats/${chatId}/messages`,
      {
        text,
      },
    );
  }

  markAsRead(
    chatId: string,
  ) {
    return this.http.patch<any>(
      `${environment.api}/chats/${chatId}/read`,
      {},
    );
  }
  sendAttachment(
  chatId: string,
  file: File,
  text?: string,
) {
  const formData =
    new FormData();

  formData.append(
    'file',
    file,
  );

  if (text?.trim()) {
    formData.append(
      'text',
      text.trim(),
    );
  }

  return this.http.post<any>(
    `${environment.api}/chats/${chatId}/attachments`,
    formData,
  );
}
}