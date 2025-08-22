import { userid, username, getUserInfo } from "../Firebase/getUserInfo.js";
import { doc, onSnapshot, query, collection, where, getDocs, limit, addDoc, updateDoc, serverTimestamp, orderBy, startAfter } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from "../Firebase/firebase.js";
import { timeAgo } from "../Firebase/timeAgo.js";
import { createChat} from "../Firebase/Messages/addMessage.js";

const EventBus = new EventTarget();

export const MessagesList = {
    template: `
        <div v-if="isMessagesContainerVisible" :class="['messages-container', { 'mobile-view': isMobile }]">
          
            <div class="messages-header">
                <h2>Messages</h2>
            </div>
        
            <div class="search-box">
                <object data="/Elements/search.svg" type="image/svg+xml" class="search-icon"></object>
                <input 
                    type="text" 
                    v-model="searchTerm" 
                    @input="debouncedSearch"
                    placeholder="SEARCH MESSAGES" 
                    class="search-bar"
                />
            </div>
        
            <div v-for="chat in filteredMessages" 
                :key="chat.id" 
                class="message-item"
                :class="{ active: chat.id === activeChat?.id }" 
                @click="setActiveChat(chat)">
            
                <div class="avatar" :style="{ backgroundImage: 'url(' + chat.avatar + ')' }"></div>
              
                <div class="message-content">
                    <h4>{{ chat.name }}</h4>
                    <p>{{ chat.text }}</p>
                </div>
              
                <div class="message-time">{{ chat.time }}</div>
            </div>
        </div>
        <button 
            v-if="!isMessagesContainerVisible && isMobile" 
            @click="showMessagesContainer" 
            class="show-messages-button">
            <3
        </button>
    `,

    data() {
        return {
            chats: [],
            users: [],
            searchTerm: "",
            activeChat: null,
            isMobile: document.documentElement.clientWidth < 768,
            unsubscribeFunctions: {},
            debounceTimeout: null,
            isMessagesContainerVisible: true,
        };
    },

    computed: {
        filteredMessages() {
            const filteredChats = this.chats.filter(chat =>
                chat.name.toLowerCase().includes(this.searchTerm.toLowerCase())
            );

            if (!this.searchTerm) {
                this.users = [];
            }

            return [...filteredChats,...this.users];
        },
    },

    methods: {
        setActiveChat(chat) {
            this.activeChat = chat;
            localStorage.setItem("activeChat", JSON.stringify(chat));
            this.$emit("chat-selected", chat);
            const event = new CustomEvent('active', { detail:
                    {
                        id: chat.id,
                        otherUsername: chat.name,
                        otherImg: chat.avatar,
                    }
            });
            EventBus.dispatchEvent(event);
            if (this.isMobile) {
                this.isMessagesContainerVisible = false;
            }
        },

        showMessagesContainer() {
            this.isMessagesContainerVisible = true;
        },

        checkScreenSize() {
            this.isMobile = document.documentElement.clientWidth < 768;
        },

        async getUserChats() {
            try {
                const docRef = doc(db, "profiles", userid);

                const unsubscribe = onSnapshot(docRef, async (docSnap) => {
                    const chats = docSnap.data().chats;
                        if (!chats) {
                            this.chats = [];
                            return;
                        }
                    chats.forEach((chat) => {
                        this.getChat(chat);
                    });
                });
            } catch (error) {
                console.log("Error getting user chats", error.code, error.message)
            }
        },

        async getChat(chatid) {
            try {
                const docRef = doc(db, "chats", chatid);

                if (this.unsubscribeFunctions[chatid]) {
                    this.unsubscribeFunctions[chatid]();
                }

                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    const chatData = docSnap.data();
                    const otherid = chatData.participants.find(id => id !== userid);
                    getUserInfo(otherid).then((otherData) => {
                        const updatedChat = {
                            id: chatid,
                            name: otherData.username,
                            text: chatData.lastMessage && chatData.lastMessage.length && chatData.lastMessage.length > 30
                                ? chatData.lastMessage.slice(0, 30) + "..." : chatData.lastMessage,
                            time: chatData.sentAt ? timeAgo(chatData.sentAt) : "",
                            sentAt: chatData.sentAt || 0,
                            avatar: otherData.profileImg,
                        };

                        if (this.users.some(existingUser => existingUser.username === updatedChat.username)) {
                            const userIndex = this.users.findIndex(existingUser => existingUser.username === updatedChat.username);

                            if (userIndex !== -1) {
                                this.users.splice(userIndex, 1);
                            }
                        }

                        const existingChatIndex = this.chats.findIndex(chat => chat.id === chatid);

                        if (existingChatIndex !== -1) {
                            this.chats[existingChatIndex] = updatedChat;
                        } else {
                            this.chats.push(updatedChat);
                        }

                        this.chats.sort((a, b) => b.sentAt - a.sentAt)

                        this.chats = [...this.chats];
                    });
                });
                this.unsubscribeFunctions[chatid] = unsubscribe;
            } catch(error) {
                console.log("Error getting chats", error.code, error.message);
            }
        },

        async getUsers() {
            try {
                if (!this.searchTerm.trim()) {
                    return
                }

                const usersQuery = query(
                    collection(db, "profiles"),
                    where("username", ">=", this.searchTerm.toLowerCase()),
                    where("username", "<=", this.searchTerm.toLowerCase() + "\uf8ff"),
                    limit(10),
                );

                const chatUsernames = this.chats.map((chat) => chat.name)

                const querySnap = await getDocs(usersQuery)
                console.log(querySnap)

                this.users = querySnap.docs
                    .map((docSnap) => {
                        const userData = docSnap.data();
                        return {
                            id: docSnap.id,
                            name: userData.username,
                            avatar: userData.profileImg,
                            text: null,
                            time: null,
                        };
                    })
                    .filter((user) => !chatUsernames.includes(user.name) && user.name !== username);


            } catch (error) {
                console.log("Error searching users", error.code, error.message)
            }
        },

        debouncedSearch() {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                this.getUsers();
            }, 300);
        },
  },

    mounted() {
        this.checkScreenSize();
        this.getUserChats();
        window.addEventListener("resize", this.checkScreenSize);
        const savedChat = localStorage.getItem("activeChat");
        if (savedChat) {
            this.activeChat = JSON.parse(savedChat);
        }
    },

    beforeUnmount() {
        window.removeEventListener("resize", this.checkScreenSize);
        this.unsubscribe();
        Object.values(this.unsubscribeFunctions).forEach((unsubscribe) => {
            unsubscribe();
        });
        this.unsubscribeFunctions = {};
        clearTimeout(this.debounceTimeout);
    },

    watch: {

    }
};

export const ChatComponent = {
  template:
    `
    <div class="hele_riba">
        <img v-if="otherUser.img" class="post-image" :src=otherUser.img>
        <div class="kasutajanimi">{{otherUser.username}}</div>
    </div>
    <div class="chat-container">
      <div class="sõnumite_ala" ref="messagesArea">
        <div 
          v-for="(message) in messages" 
          :key="message.id" 
          :class="message.isSender ? 'send-message' : 'receive-message'"
        >
          <img 
            :src="message.isSender ? currentUser.img : otherUser.img " 
            :alt="message.isSender ? 'User Avatar' : 'Recipient Avatar'" 
            :class="message.isSender ? 'user-pfp' : 'recieve-pfp'" 
          />
          
          <div :class="message.isSender ? 'send-message-box' : 'recieve-message-box'">
            {{ message.text }}
          </div>
        </div>
      </div>

      
      <div class="sõnumi_saatmine">
        <textarea 
          v-model="newMessage" 
          placeholder="Type a message"
          @keydown="handleKeydown"
        ></textarea>
        
        <img 
          src="../Elements/send.svg" 
          alt="Send Icon" 
          class="send" 
          @click="sendMessage" 
        />
      </div>
    </div>  
  `,

    data() {
        return {
            chatId: null,
            messages: [],
            newMessage: "",
            currentUser: {},
            otherUser: {},
            loading: false,
            lastVisible: null,
            hasMore: true,
            unsubscribe: null,
        scrollTop: null,
    };
  },

  methods: {
    async sendMessage() {
      if (this.newMessage.trim() !== "") {
            try {
                if (!this.chatId) return;
                if (!this.chatId.includes(this.currentUser.id)) {
                    this.chatId = await createChat(this.chatId);
                }

                await addDoc(collection(db, "chats", this.chatId, "messages"), {
                    senderId: userid,
                    message: this.newMessage,
                    time: serverTimestamp(),
                });
                await updateDoc(doc(db, "chats", this.chatId), {
                    lastMessage: this.newMessage,
                    sentAt: serverTimestamp(),
                });

                this.newMessage = "";
                console.log("Data added");
                this.updateMessages();
            } catch (error) {
            console.log("Error adding message:", error.code, error.message);
            alert("Error sending message")
            }
      }
    },

    handleKeydown(event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.sendMessage();
      }
    },

    scrollToBottom() {
      const messagesArea = this.$refs.messagesArea;

      const isAtBottom = messagesArea.scrollHeight - messagesArea.scrollTop <= messagesArea.clientHeight + 10;

      this.$nextTick(() => {
        const messagesArea = this.$refs.messagesArea;
        if (messagesArea) {
            if (isAtBottom) {
                messagesArea.scrollTop = messagesArea.scrollHeight;
            } else {
                const scrollPosition = messagesArea.scrollTop;
                messagesArea.scrollTop = scrollPosition;
            }
        }
      });
    },

    updateMessages() {
      try {
          let queryRef = query(
              collection(db, "chats", this.chatId, "messages"),
              orderBy("time", "asc"),
          );

          this.unsubscribe = onSnapshot(queryRef, (querySnapshot) => {
              const messages = querySnapshot.docs.map((doc) => {
                  const data = doc.data();
                  return {
                      id: doc.id,
                      text: data.message,
                      isSender: this.currentUser.id === data.senderId,
                      date: data.time,
                  }
              });

              const newMessages = messages.filter(message =>
                        !this.messages.some(existingMessage => existingMessage.id === message.id));

              if (!newMessages.length) return;

              this.messages = [...this.messages, ...newMessages];

          });
      } catch (error) {
          console.log("Error updating messages", error.code, error.message)
      }
    },


    async getCurrentUserInfo() {
        const data = await getUserInfo(userid);

        this.currentUser = {
            id: userid,
            img: data.profileImg,
        };
    },

    updateChatData(event) {
        const {id, otherUsername, otherImg} = event.detail;

        this.chatId = id;
        this.otherUser = {
            username: otherUsername,
            img: otherImg,
        };
        if (this.unsubscribe) this.unsubscribe();
        this.messages = [];
        this.updateMessages();
    },

  },

  async mounted() {
    this.getCurrentUserInfo();
    EventBus.addEventListener('active', this.updateChatData);

  },
  beforeUnmount() {
      if (this.unsubscribe) this.unsubscribe();
      EventBus.removeEventListener('active', this.updateChatData);
  },
  watch : {
      messages() {
          this.scrollToBottom();
      }
  }
};
