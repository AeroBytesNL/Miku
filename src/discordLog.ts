import {
    AttachmentBuilder,
    AuditLogEvent,
    Client,
    EmbedBuilder,
    Events as discordEvents,
    GuildBan,
    GuildMember,
    Message,
    OmitPartialGroupDMChannel,
    PartialGuildMember,
    PartialMessage,
    TextChannel,
    VoiceState,
    User,
    Collection,
    Snowflake,
} from 'discord.js';
import { Logging } from './logging';
import path from 'path';
import { fileURLToPath } from 'url';

export enum Color {
    White = '#ECF0F1',
    Red = '#ff0000',
    Green = '#008000',
    Blue = '#0000ff',
    Orange = '#ffa500',
    Opacity50 = 'rgba(0, 0, 0, 0.5)',
    AdtgPurple = '#5C0382',
}

export class discordLog {
    private client: Client;
    private logChannel: any;
    private botIcon: AttachmentBuilder;
    private chatIcon: AttachmentBuilder;
    private voiceChatIcon: AttachmentBuilder;
    private reactionIcon: AttachmentBuilder;
    private userIcon: AttachmentBuilder;
    private moderationIcon: AttachmentBuilder;

    constructor(client: Client, logChannelId: string) {
        this.client = client;
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        this.logChannel = this.client.channels.cache.get(logChannelId) as TextChannel;
        this.botIcon = new AttachmentBuilder(path.join(__dirname, '../media/discordLog/bot.png'));
        this.chatIcon = new AttachmentBuilder(path.join(__dirname, '../media/discordLog/chat.png'));
        this.voiceChatIcon = new AttachmentBuilder(path.join(__dirname, '../media/discordLog/microphone.png'));
        this.reactionIcon = new AttachmentBuilder(path.join(__dirname, '../media/discordLog/chat.png'));
        this.userIcon = new AttachmentBuilder(path.join(__dirname, '../media/discordLog/user.png'));
        this.moderationIcon = new AttachmentBuilder(path.join(__dirname, '../media/discordLog/moderation.png'));
        void this.bootEvent()
        this.messageEvents();
        this.reactionEvents();
        this.voiceChannelEvents();
        void this.memberEvents()
    }

    async bootEvent(): Promise<void> {
        try {
            await new Promise<void>(resolve => {
                const interval = setInterval((): void => {
                    if (this.client.ws.ping >= 0) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 500);
            });

            const bootEmbed: EmbedBuilder = new EmbedBuilder()
                .setColor(Color.AdtgPurple)
                .setTitle('I ben opnieuw opgestart!')
                .addFields(
                    { name: 'Gebruiker:', value: `<@${this.client.user?.id}>` },
                    { name: 'Ping:', value: `${this.client.ws.ping}ms` }
                )
                .setThumbnail('attachment://bot.png');

            Logging.info('Sending bootEvent')

            await this.logChannel.send({ embeds: [bootEmbed], files: [this.botIcon] });
        } catch (error) {
            Logging.error(`Error in bootEvent serverLogger: ${error}`);
        }
    }

    /**
     * Handles all message logging.
     *
     * - Message edit.
     * - Message delete.
     * - Message bulk delete.
     * @return void
     */
    messageEvents(): void {
        this.client.on(discordEvents.MessageUpdate, async (
            oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>,
            newMessage: OmitPartialGroupDMChannel<Message<boolean>>): Promise<void> => {
            if (newMessage.author.id === this.client.user?.id) return;

            Logging.debug('An message has been edited!');

            const messageUpdateEmbed: any = new EmbedBuilder()
                .setColor(Color.Orange)
                .setTitle('Bericht bewerkt')
                .setThumbnail('attachment://chat.png')
                .addFields(
                    { name: 'Gebruiker', value: `<@${oldMessage.author?.id}>`},
                    { name: 'Oud:', value: oldMessage.content ?? 'Er ging wat fout' },
                    { name: 'Nieuw:', value: newMessage.content ?? 'Er ging wat fout'}
                );

            this.logChannel.send({ embeds: [messageUpdateEmbed], files: [this.chatIcon] });
        });

        this.client.on(discordEvents.MessageDelete, async (message: Message<boolean> | PartialMessage): Promise<void> => {
            if (message.author?.id === this.client.user?.id) return;

            Logging.debug('An message has been deleted!');

            const messageDelete: any = new EmbedBuilder()
                .setColor(Color.Red)
                .setTitle('Bericht verwijderd')
                .setThumbnail('attachment://chat.png')
                .addFields(
                    {
                        name: 'Gebruiker',
                        value: `<@${message.partial ? '0' : (message.author?.id ?? 'Onbekend')}>`
                    },
                    {
                        name: 'Bericht:',
                        value: message.content ?? 'Er ging wat fout'
                    }
                );

            await this.logChannel.send({ embeds: [messageDelete] });
        });

        this.client.on('messageBulkDelete', async (messages: Collection<Snowflake, Message | PartialMessage>): Promise<void> => {
            Logging.debug('Bulk messages have been deleted!');

            const deletedMessages: any[] = [];

            for (const message of messages.values()) {
                deletedMessages.push({
                    name: `Van: ${message.member?.displayName || message.author?.tag || 'Niet bekend'}`,
                    value: message.content || 'Geen inhoud',
                });
            }

            const bulkMessagesDeleted: EmbedBuilder = new EmbedBuilder()
                .setColor(Color.Red)
                .setTitle('Bulk berichten verwijderd')
                .setThumbnail('attachment://chat.png')
                .addFields(...deletedMessages);

            await this.logChannel.send({ embeds: [bulkMessagesDeleted], files: [this.chatIcon] });
        });
    }

    /**
     * Handles all reaction logging
     *
     * @return void
     */
    reactionEvents(): void {
        this.client.on(discordEvents.MessageReactionAdd, async (reaction, user) => {
            if (user.id === this.client.user?.id) return;

            Logging.info('Reaction added to message!');

            const messageReactionAddEmbed: EmbedBuilder = new EmbedBuilder()
                .setColor(Color.Green)
                .setTitle('Reactie toegevoegd')
                .setDescription(`Door: <@${user.id}>`)
                .setThumbnail('attachment://happy-face.png')
                .addFields(
                    { name: 'Gebruiker:', value: `<@${user.id}>` },
                    { name: 'Emoji:', value: `${reaction.emoji}` },
                    { name: 'Bericht:', value: `${reaction.message.url}` }
                );

            await this.logChannel.send({ embeds: [messageReactionAddEmbed], files: [this.reactionIcon] });
        });

        this.client.on(discordEvents.MessageReactionRemove, async (reaction, user) => {
            if (user.id === this.client.user?.id) return;

            Logging.info('Reaction removed to message!');

            const messageReactionAddEmbed: EmbedBuilder = new EmbedBuilder()
                .setColor(Color.Orange)
                .setTitle('Reactie verwijderd')
                .setThumbnail('attachment://happy-face.png')
                .addFields(
                    { name: 'Gebruiker:', value: `<@${user.id}>` },
                    { name: 'Emoji:', value: `${reaction.emoji}` },
                    { name: 'Bericht:', value: `${reaction.message.url}` }
                );

            await this.logChannel.send({ embeds: [messageReactionAddEmbed], files: [this.reactionIcon] });
        });
    }

    /**
     * Handles voice channel logging
     *
     * @return void
     */
    voiceChannelEvents(): void {
        this.client.on(discordEvents.VoiceStateUpdate, async (oldState: VoiceState, newState: VoiceState) => {
            // If user joins voice channel
            if (!oldState.channel && newState.channel) {
                const voiceChannelEmbed: EmbedBuilder = new EmbedBuilder()
                    .setColor(Color.Green)
                    .setTitle('Voice kanaal gejoined')
                    .setThumbnail('attachment://microphone.png')
                    .addFields(
                        { name: 'Gebruiker:', value: `<@${newState.member?.user.id}>` },
                        { name: 'Kanaal:', value: `${newState.channel.url}` },
                    );

                await this.logChannel.send({ embeds: [voiceChannelEmbed], files: [this.voiceChatIcon] });
            }

            // If user leaves voice channel
            if (oldState.channel && !newState.channel) {
                Logging.info('A user leaved VC');

                const voiceChannelEmbed: EmbedBuilder = new EmbedBuilder()
                    .setColor(Color.Orange)
                    .setTitle('Voice kanaal verlaten')
                    .setThumbnail('attachment://microphone.png')
                    .addFields(
                        { name: 'Gebruiker:', value: `<@${oldState.member?.user.id}>` },
                        { name: 'Kanaal:', value: `${oldState.channel.url}` },
                    );

                await this.logChannel.send({ embeds: [voiceChannelEmbed], files: [this.voiceChatIcon] });
            }

            // If user changes voice channel
            if (oldState.channel && newState.channel) {
                Logging.info('A user changed VC');

                const voiceChannelEmbed: EmbedBuilder = new EmbedBuilder()
                    .setColor(Color.Green)
                    .setTitle('Voice kanaal veranderd')
                    .setThumbnail('attachment://microphone.png')
                    .addFields(
                        { name: 'Gebruiker:', value: `<@${oldState.member?.user.id}>` },
                        { name: 'Oud:', value: `${oldState.channel.url}` },
                        { name: 'Nieuw:', value: `${newState.channel.url}` },
                    );

                await this.logChannel.send({ embeds: [voiceChannelEmbed], files: [this.voiceChatIcon] });
            }
        });
    }

    /**
     * Handles membership-related events in a Discord server, such as when members join, leave, are banned, unbanned, or updated.
     * Logs the events and sends an embed message to a designated channel with information about the membership event.
     *
     * @return {Promise<void>} Resolves when the events are registered and handled properly.
     */
    async memberEvents(): Promise<void> {
        // On member join is handles by invite tracker

        this.client.on(discordEvents.GuildMemberRemove, async (member: GuildMember|PartialGuildMember): Promise<void> => {
            Logging.info('A user left this Discord!');

            const memberEventEmbed = new EmbedBuilder()
                .setColor(Color.Red)
                .setTitle('Lid verlaten')
                .setThumbnail('attachment://user.png')
                .addFields(
                    { name: 'Gebruiker:', value: `<@${member.id}>` },
                    { name: 'Lid sinds:', value: `<t:${Math.floor(member.joinedTimestamp ?? 0 / 1000)}:F>` },
                );

            await this.logChannel.send({ embeds: [memberEventEmbed], files: [this.userIcon] });
        });

        this.client.on(discordEvents.GuildBanAdd, async (ban: GuildBan): Promise<void> => {
            Logging.info('A user was banned on this Discord!');

            const fetchBan: GuildBan = await ban.guild.bans.fetch(ban.user.id);
            const auditLogs = await ban.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanAdd,
                limit: 1
            });

            const banLog = auditLogs.entries.find(
                entry => entry.target?.id === ban.user?.id);

            let executor: User | null | undefined = undefined;
            if (banLog?.executor instanceof User) {
                executor = banLog.executor;
            }

            const memberEventEmbed = new EmbedBuilder()
                .setColor(Color.Red)
                .setTitle('Lid gebanned')
                .setThumbnail('attachment://moderation.png')
                .addFields(
                    { name: 'Gebruiker:', value: `<@${ban.user.id}>` },
                    { name: 'Reden:', value: `${fetchBan.reason ?? 'Geen reden opgegeven'}` },
                    { name: 'Door:', value: executor ? `${executor.username} (<@${executor.id}>)` : 'Onbekend' },
                );

            await this.logChannel.send({ embeds: [memberEventEmbed], files: [this.moderationIcon] });
        });

        this.client.on(discordEvents.GuildBanRemove, async (unBan: GuildBan): Promise<void> => {
            Logging.info('A user was unbanned on this Discord!');

            const auditLogs = await unBan.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanAdd,
                limit: 1
            });

            const unBanLog = auditLogs.entries.find(
                entry => entry.target?.id === unBan.user.id);

            let executor: User | null | undefined = undefined;
            if (unBanLog?.executor instanceof User) {
                executor = unBanLog.executor;
            }

            const memberEventEmbed = new EmbedBuilder()
                .setColor(Color.Orange)
                .setTitle('Lid unbanned')
                .setThumbnail('attachment://moderation.png')
                .addFields(
                    { name: 'Gebruiker:', value: `<@${unBan.user.id}>` },
                    { name: 'Door:', value: executor ? `${executor.username} (<@${executor.id}>)` : 'Onbekend' },
                )

            await this.logChannel.send({ embeds: [memberEventEmbed], files: [this.moderationIcon] });
        });

        this.client.on(discordEvents.GuildMemberUpdate, async (oldMember: GuildMember|PartialGuildMember, newMember: GuildMember): Promise<void> => {
            if (oldMember.displayName === newMember.displayName) return;

            Logging.info('A user was updated in this Discord!');


            const memberEventEmbed = new EmbedBuilder()
                .setColor(Color.Green)
                .setTitle('Lid gebruikersnaam update')
                .setThumbnail('attachment://user.png')
                .addFields(
                    { name: 'Gebruiker:', value: `<@${newMember.user.id}>` },
                    { name: 'Oud:', value: `${oldMember.displayName ?? 'Niet gevonden'}` },
                    { name: 'Nieuw:', value: `${newMember.displayName ?? 'Niet gevonden'}` },
                );

            await this.logChannel.send({ embeds: [memberEventEmbed], files: [this.userIcon]});
        });
    }
}