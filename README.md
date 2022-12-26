## Under Construction
### TODO
Monolith structure for now

### Mod Integration
- Use Cloudflare Tunnels to expose localhost server
- Use @sapphire/pieces to build an API
    - /event
- Modules
    - Activation
        - API
        - Cron
        - Cron with Hypixel API data? (removal planned)
            - This is going to be difficult
            - Defender module must be removed

## Planning
### Microservices
#### Backend - Not until interaction-kit is stable?
- [X] Use @sapphire/pieces to build API/Modules
- [ ] Two separate i18n files?????
- [ ] Access DAPI via REST
- API
    - /api, stats, errors, logic
    - /config core, general config
    - /data, all data, history
    - /module, module config
    - /performance, more stats (remove?)
    - /register, POST user
    - /reload, reload endpoint?
    - /systemmessage, POST systemmessage
    - RegistrationPrecondition, user exists

#### Bot
- [ ] Cloudflare Worker?
    - 10ms on each Cloudflare worker execution is a bit small
    - Microservice arch?
- [ ] Include Prisma ORM with bot?
    - Reduced endpoints or increased chaos but faster connections
