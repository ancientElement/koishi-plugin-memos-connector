import { Context, HTTP, Schema } from 'koishi'

export const name = 'qq-memos'

export interface Config {
    memos_sverver?: string
    token?: string
}

export const Config: Schema<Config> = Schema.object({
    memos_sverver: Schema.string().description('memos服务器地址').default(""),
    token: Schema.string().description('memos用户令牌').role('secret'),
})


const VISIBILITY = {
    VISIBILITY_UNSPECIFIED: 'VISIBILITY_UNSPECIFIED',
    PRIVATE: 'PRIVATE',
    PROTECTED: 'PROTECTED',
    PUBLIC: 'PUBLIC'
}

const addMemo = async (ctx: Context,config: Config,content: any,visibility: string = VISIBILITY.PRIVATE) => {
    const url = `${config.memos_sverver}/api/v1/memos`
    return await ctx.http('POST',url,{
        data:JSON.stringify({
            content: content,
            visibility: visibility,
            resources: [],
            relations: []
        }),
        headers: {
            'Authorization': config.token
        },
    })
}

let startContinuousInput = false

export function apply(ctx: Context, config: Config) {
    // write your plugin here
    ctx.command("mm [message:text]","创建memo")
    .option("public", "-p 创建公开memo",{fallback:false})
    .option("protected", "-o 创建受保护memo",{fallback:false})
    .option("private", "-i 创建私有memo",{fallback:false})
    .action(async ({session,options},message)=>{
        let res
        const visibility = options.public ? VISIBILITY.PUBLIC : options.protected ? VISIBILITY.PROTECTED : VISIBILITY.PRIVATE
        if (message){
            res = await addMemo(ctx,config,message,visibility)
        } else {
            await session.send("请输入要创建的memo内容\n使用emm作为最后一条消息")
            startContinuousInput = true
            let context = await session.prompt(60000)
            let contextFianl = context
            while (context && context != "emm"){
                context = await session.prompt(60000)
                contextFianl = `${contextFianl}\n${context}`
            }
            if (!contextFianl) return "没有输入内容"
            res = await addMemo(ctx,config,contextFianl,visibility)
        }
        const name = res.data.name
        const creator = res.data.creator
        const visibilityString = res.data.visibility
        const createTime = res.data.createTime
        return `memo创建成功！\n名称：${name}\n创建者：${creator}\n可见性：${visibilityString}\n创建时间：${createTime}`
    })

    ctx.command("emm","结束memos")
    .action(async ()=>{
        if (!startContinuousInput) return "没有正在输入的memo"
        startContinuousInput = false
    })
}
