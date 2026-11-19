/* 统一数据模型：阶段 → (段) → 微环节
 * 每个 step: { id, name, who[], inputs[], actions[], outputs[], systems[], judge, ai, aiNote, kpis[], risks[] }
 */
const MODEL = [
  {
    id: "P1", name: "市场与销售", color: "#2563eb",
    goal: "从找到线索，到签下合同并安全移交给交付",
    segments: [
      {
        id: "A", name: "线索获取", goal: "把「可能买设备的人」变成一条可跟进的线索",
        steps: [
          { id: "A1", name: "展会与活动名单收集", who: ["市场", "销售"], inputs: ["展会观众名录", "名片扫描"], actions: ["名录清洗并按行业分类"], outputs: ["线索批量导入表"], systems: ["CRM"], judge: "是否 PCB / EMS 类客户", ai: "可自动", aiNote: "名单清洗、去重、按行业打标" },
          { id: "A2", name: "老客户复购与换机巡检", who: ["售后", "销售"], inputs: ["设备服役年限", "维保记录"], actions: ["按服役年限筛选换机候选"], outputs: ["复购线索"], systems: ["CRM", "售后系统"], judge: "服役 ≥3 年或产能瓶颈", ai: "可自动", aiNote: "按购置日预测换机窗口" },
          { id: "A3", name: "线上留资与来电", who: ["市场"], inputs: ["官网表单", "公众号", "400 来电"], actions: ["留资信息归档与初步判定"], outputs: ["线索记录"], systems: ["CRM 表单"], judge: "联系方式 + 板卡信息是否齐全", ai: "可自动", aiNote: "表单解析、自动建档" },
          { id: "A4", name: "竞品替换情报", who: ["销售"], inputs: ["客户在用设备", "痛点", "合同到期时间"], actions: ["收集竞品型号与报价"], outputs: ["替换线索"], systems: ["CRM"], judge: "竞品型号 + 到期时间明确", ai: "可辅助", aiNote: "情报归纳、时机提醒" },
          { id: "A5", name: "圈子转介绍", who: ["销售", "老板"], inputs: ["客户 / 同行 / 供应商推荐"], actions: ["记录推荐人与关系链"], outputs: ["线索 + 推荐人"], systems: ["CRM"], judge: "推荐人可信度与关系链", ai: "只能人做", aiNote: "" }
        ]
      },
      {
        id: "B", name: "线索清洗与分配", goal: "让线索池可读、可分配、有人负责",
        steps: [
          { id: "B1", name: "线索去重与查重", who: ["销售助理"], inputs: ["线索池全量"], actions: ["按公司 / 联系人 / 电话合并"], outputs: ["合并后的线索"], systems: ["CRM"], judge: "同公司 + 同联系人判定重复", ai: "可自动", aiNote: "公司名相似度 + 域名 + 电话查重" },
          { id: "B2", name: "线索分级打分", who: ["销售主管"], inputs: ["线索字段完整度"], actions: ["按板型 / 预算 / 时间 / 决策人打分"], outputs: ["A / B / C 级"], systems: ["CRM"], judge: "四项是否齐全", ai: "可辅助", aiNote: "给出分级建议，人可推翻" },
          { id: "B3", name: "分配销售与首触 SLA", who: ["销售主管"], inputs: ["分级结果", "区域 / 行业"], actions: ["指派销售并设定首触时限"], outputs: ["分配记录", "超时预警"], systems: ["CRM"], judge: "48 小时内完成首次触达", ai: "可自动", aiNote: "超时自动提醒与升级" }
        ]
      },
      {
        id: "C", name: "商机立项", goal: "把「有点意向」升级成「值得投入资源」的商机",
        steps: [
          { id: "C1", name: "线索转商机判定", who: ["销售"], inputs: ["线索", "沟通记录"], actions: ["核对四项条件后转档"], outputs: ["商机记录"], systems: ["CRM"], judge: "板卡 / 预算 / 时间 / 决策人 四项齐", ai: "可辅助", aiNote: "按记录判断四项是否满足" },
          { id: "C2", name: "商机建档", who: ["销售"], inputs: ["客户信息", "竞品", "预算"], actions: ["填写商机卡片与预计签约日"], outputs: ["商机卡片"], systems: ["CRM"], judge: "必填字段完整率 ≥ 90%", ai: "可自动", aiNote: "从邮件 / 纪要补全字段" },
          { id: "C3", name: "商机评审与资源投入", who: ["销售主管", "应用工程"], inputs: ["商机卡片", "历史赢率"], actions: ["评估跟不跟、投多少资源"], outputs: ["评审结论"], systems: ["CRM"], judge: "金额 / 毛利 / 赢率是否达标", ai: "可辅助", aiNote: "赢率预测、相似项目比对" }
        ]
      },
      {
        id: "D", name: "需求与技术评估", goal: "确认这个需求我们做得了、测得准",
        steps: [
          { id: "D1", name: "需求澄清会", who: ["销售", "应用工程"], inputs: ["客户测试要求"], actions: ["确认测试点、精度、UPH、良率"], outputs: ["需求确认单"], systems: ["CRM", "会议纪要"], judge: "测试点数 / 精度 / UPH 明确", ai: "可辅助", aiNote: "纪要自动转需求条目" },
          { id: "D2", name: "客户寄样打样测试", who: ["应用工程"], inputs: ["客户板卡样品"], actions: ["上机试测并出报告"], outputs: ["测试报告"], systems: ["测试软件", "CRM"], judge: "良率、误判率是否达标", ai: "只能人做", aiNote: "判断依赖工程师经验" },
          { id: "D3", name: "技术可行性结论", who: ["研发", "应用工程"], inputs: ["打样结果", "测试点文件"], actions: ["判定是否需非标、定风险等级"], outputs: ["技术评估单"], systems: ["PLM", "评审表"], judge: "非标范围与风险等级", ai: "只能人做", aiNote: "" }
        ]
      },
      {
        id: "E", name: "方案与报价", goal: "把技术方案变成可交付、能赚钱的报价",
        steps: [
          { id: "E1", name: "选型配置", who: ["应用工程"], inputs: ["需求确认单"], actions: ["选探针数、测试点数、机台型号"], outputs: ["配置单"], systems: ["报价工具"], judge: "探针数 / 最大测试点是否匹配", ai: "可辅助", aiNote: "按点数推荐机型" },
          { id: "E2", name: "非标项识别与工时评估", who: ["研发", "应用"], inputs: ["配置单", "客户特殊要求"], actions: ["逐条列非标并估工时"], outputs: ["非标清单"], systems: ["评审表"], judge: "非标项是否全覆盖", ai: "可辅助", aiNote: "比对历史项目找漏项" },
          { id: "E3", name: "成本测算与报价审批", who: ["财务", "销售"], inputs: ["配置单", "非标清单", "料本"], actions: ["算成本、按权限审折扣"], outputs: ["成本表", "报价单"], systems: ["ERP"], judge: "毛利率 ≥ 公司底线", ai: "可自动", aiNote: "成本汇总、超权限拦截" },
          { id: "E4", name: "报价发出与版本管理", who: ["销售"], inputs: ["审批通过的报价"], actions: ["发出并归档版本"], outputs: ["报价单 v1 / v2 / v3"], systems: ["CRM"], judge: "版本可追溯、有效期明确", ai: "可自动", aiNote: "版本归档与到期提醒" }
        ]
      },
      {
        id: "F", name: "商务谈判与签约", goal: "把报价谈成合同，并安全交给交付",
        steps: [
          { id: "F1", name: "商务谈判", who: ["销售", "老板"], inputs: ["报价单", "竞品价", "客户预算"], actions: ["谈价格 / 交期 / 付款 / 质保"], outputs: ["谈判记录"], systems: ["CRM"], judge: "四项是否谈定", ai: "只能人做", aiNote: "让步策略可辅助生成" },
          { id: "F2", name: "合同评审", who: ["法务", "财务", "交付"], inputs: ["合同草案"], actions: ["三条红线逐条核"], outputs: ["合同评审单"], systems: ["ERP", "合同系统"], judge: "验收标准 / 付款节点 / 违约条款", ai: "可辅助", aiNote: "条款与标准模板比对" },
          { id: "F3", name: "用印与预收款", who: ["商务", "财务"], inputs: ["评审通过合同"], actions: ["用印、开预收"], outputs: ["合同", "收款凭证"], systems: ["ERP"], judge: "预收比例 ≥ 30%", ai: "可自动", aiNote: "未收款提醒并阻断下单" },
          { id: "F4", name: "订单移交评审", who: ["销售", "项目经理"], inputs: ["合同", "技术协议", "报价单"], actions: ["资料齐套检查后移交"], outputs: ["移交清单", "评审启动"], systems: ["ERP"], judge: "资料齐套率 100%", ai: "可辅助", aiNote: "齐套性自动检查" }
        ]
      }
    ]
  },

  {
    id: "P2", name: "订单评审与立项", color: "#0891b2",
    goal: "确认这单能不能做、赚不赚钱、来不来得及，然后立项",
    steps: [
      { id: "S04", name: "订单评审", who: ["销售", "项目经理", "研发", "生产", "采购"], inputs: ["销售订单", "技术方案"], actions: ["非标清单化并逐条确认", "产能与关键资源校核", "长交期件核价核期", "成本与毛利复核"], outputs: ["订单评审记录", "非标清单", "风险清单"], systems: ["ERP", "PLM"], judge: "非标项是否全部识别", kpis: ["评审一次通过率", "评审耗时"], risks: ["非标识别不全 → 设计阶段暴雷", "长交期件被忽略 → 交付延期"] },
      { id: "S05", name: "项目立项与主计划", who: ["PMO", "项目经理"], inputs: ["订单评审记录", "合同交期"], actions: ["WBS 拆解", "里程碑与关键路径", "资源与预算分配"], outputs: ["项目主计划", "里程碑基线"], systems: ["项目管理系统", "ERP"], judge: "里程碑是否可承诺", kpis: ["计划达成率", "里程碑偏差天数"], risks: ["计划没留缓冲", "多项目抢装配调试资源"] }
    ]
  },

  {
    id: "P3", name: "设计与 BOM", color: "#7c3aed",
    goal: "把方案落成能制造、能装配的图纸与 BOM",
    steps: [
      { id: "S06", name: "机械 / 电气设计", who: ["结构工程师", "电气工程师"], inputs: ["技术方案", "客户板卡尺寸"], actions: ["3D 建模与干涉检查", "夹具 / 探针模组设计", "电气原理图与线束"], outputs: ["图纸", "BOM", "装配工艺文件"], systems: ["PLM", "CAD"], judge: "图纸能否指导装配", kpis: ["设计返工率"], risks: ["客户板卡变更导致夹具重做", "设计与装配工艺脱节"] },
      { id: "S07", name: "软件与探针配置", who: ["软件工程师", "应用工程师"], inputs: ["测试点文件", "探针规格"], actions: ["测试程序开发", "探针排布与寿命评估", "阈值设定"], outputs: ["软件版本", "探针配置单"], systems: ["PLM", "Git"], judge: "能否测出客户要的结果", kpis: ["程序一次调试通过率"], risks: ["探针选型不当导致误判", "客户测试标准中途变更"] },
      { id: "S08", name: "ECN 设计变更", who: ["研发", "项目经理", "采购", "生产"], inputs: ["变更申请"], actions: ["评估在制 / 在途 / 在库影响", "审批与生效批次", "BOM 升版"], outputs: ["ECN 单", "BOM 新版本"], systems: ["PLM", "ERP"], judge: "影响范围是否评估完整", kpis: ["变更响应时长", "呆滞金额"], risks: ["未评估就执行 → 物料呆滞", "变更没传到现场，装错版本"] }
    ]
  },

  {
    id: "P4", name: "计划与采购", color: "#d97706",
    goal: "把项目计划翻译成采购和生产能执行的动作",
    steps: [
      { id: "S09", name: "主计划与 MRP", who: ["PMC", "计划员"], inputs: ["项目主计划", "BOM", "库存与在途"], actions: ["排产", "MRP 运算生成净需求", "缺料与齐套分析"], outputs: ["生产计划", "采购申请", "缺料清单"], systems: ["ERP"], judge: "齐套率是否满足开工", kpis: ["物料齐套率", "库存周转天数"], risks: ["长交期件没提前锁定", "插单打乱产线"] },
      { id: "S10", name: "采购与外协", who: ["采购", "SQE"], inputs: ["采购申请", "BOM"], actions: ["询价比价", "下达 PO 并跟催", "外协机加工（钣金 / CNC）"], outputs: ["采购订单", "外协订单"], systems: ["ERP", "SRM"], judge: "交期与价格是否达标", kpis: ["采购准交率", "采购降本率"], risks: ["直线电机等长交期件延期", "外协质量波动回厂返修"] },
      { id: "S11", name: "来料检验 IQC", who: ["IQC", "仓管"], inputs: ["到货通知", "检验标准"], actions: ["抽检 / 全检", "尺寸与电气性能验证", "判定入库或退货"], outputs: ["检验报告", "入库单"], systems: ["QMS", "WMS"], judge: "合格率是否达标", kpis: ["来料合格率", "检验及时率"], risks: ["免检物料出问题装配才发现", "让步接收口子开太大"] }
    ]
  },

  {
    id: "P5", name: "装配与调试", color: "#db2777",
    goal: "把设备装出来，并调到承诺的精度",
    steps: [
      { id: "S12", name: "机械 / 电气装配", who: ["装配班组", "工艺工程师"], inputs: ["领料单", "图纸", "装配工艺"], actions: ["机械装配与调平", "电气接线与线号核对", "自检报工"], outputs: ["装配记录", "工序报工单"], systems: ["MES", "ERP"], judge: "是否按版本装配", kpis: ["装配直通率", "单台装配工时"], risks: ["缺料停线", "装配与图纸版本不一致"] },
      { id: "S13", name: "软件部署与标定", who: ["应用工程", "软件"], inputs: ["软件版本", "探针模组", "标定标准件"], actions: ["装机与参数初始化", "探针校准", "精度标定与补偿"], outputs: ["标定记录", "参数文件"], systems: ["MES", "测试软件"], judge: "精度是否达标", kpis: ["标定一次通过率"], risks: ["精度不达标反复调", "标定记录缺失无法复现"] },
      { id: "S14", name: "空跑与内部测试", who: ["测试组", "质量"], inputs: ["标定记录", "测试板"], actions: ["空板连续跑机", "GR&R 重复性再现性", "长时间稳定性"], outputs: ["测试数据", "问题清单"], systems: ["MES", "QMS"], judge: "CPK / GR&R 是否达标", kpis: ["内部测试一次通过率"], risks: ["用例覆盖不足 FAT 才暴露", "为赶交期压缩测试"] }
    ]
  },

  {
    id: "P6", name: "测试与验收", color: "#0d9488",
    goal: "在客户看到之前先自己找问题，然后让客户签字",
    steps: [
      { id: "S15", name: "FAT 厂内验收", who: ["项目经理", "质量", "客户"], inputs: ["内部测试数据", "FAT 大纲"], actions: ["按大纲逐项演示", "不符合项整改", "签署 FAT 报告"], outputs: ["FAT 报告", "整改单", "发运放行单"], systems: ["QMS"], judge: "验收项是否全部通过", kpis: ["FAT 一次通过率", "FAT 周期天数"], risks: ["客户临时加验收项", "不符合项反复拖成延期"] },
      { id: "S16", name: "包装与发运", who: ["物流", "生产"], inputs: ["发运放行单", "箱单"], actions: ["防震包装与固定", "报关物流保险", "随货资料备件"], outputs: ["发货单", "箱单", "运单"], systems: ["ERP", "WMS"], judge: "包装与资料是否齐套", kpis: ["运输破损率", "发运及时率"], risks: ["运输损坏索赔", "随货资料缺失现场装不起来"] }
    ]
  },

  {
    id: "P7", name: "现场交付", color: "#4d7c0f",
    goal: "在客户产线上跑通，拿到验收单",
    steps: [
      { id: "S17", name: "安装与 SAT", who: ["售后工程师", "应用工程"], inputs: ["发货单", "SAT 验收标准"], actions: ["就位与二次调平", "带板测试", "与客户产线联调"], outputs: ["SAT 验收单", "遗留问题清单"], systems: ["售后服务系统"], judge: "SAT 项是否通过", kpis: ["现场装机天数", "SAT 一次通过率"], risks: ["现场水电气条件不满足", "客户产线排期变化验收拖延"] },
      { id: "S18", name: "培训与移交", who: ["应用工程", "售后"], inputs: ["SAT 验收单"], actions: ["操作与编程培训", "维护与耗材更换培训", "资料与备件移交"], outputs: ["培训记录", "移交清单"], systems: ["售后服务系统"], judge: "客户能否独立操作", kpis: ["客户满意度"], risks: ["客户人员流动培训白做", "操作不当导致误判投诉"] }
    ]
  },

  {
    id: "P8", name: "回款与售后", color: "#b45309",
    goal: "把钱收回来，并把一次性交付变成长期收入",
    steps: [
      { id: "S19", name: "回款与项目核算", who: ["财务", "项目经理"], inputs: ["发货单", "SAT 验收单"], actions: ["开票", "应收跟踪与催收", "项目成本归集"], outputs: ["发票", "应收账款台账", "项目毛利表"], systems: ["ERP", "财务系统"], judge: "回款是否按节点", kpis: ["DSO", "项目毛利率"], risks: ["验收拖延导致回款连锁延期", "成本归集不全毛利虚高"] },
      { id: "S20", name: "售后与备件", who: ["售后", "备件"], inputs: ["客户服务请求", "质保信息"], actions: ["远程 / 现场维修", "探针与耗材供应", "软件升级改造"], outputs: ["服务工单", "备件订单"], systems: ["售后服务系统", "CRM"], judge: "SLA 是否达标", kpis: ["首次响应时长", "备件复购率"], risks: ["关键备件缺货导致停线索赔", "售后问题没回流到设计质量"] }
    ]
  }
];

/* P1 微环节的指标与风险（补齐七属性） */
const P1_METRICS = {
  A1: { kpis: ["线索获取成本", "有效线索率"], risks: ["名单质量差，销售不跟"] },
  A2: { kpis: ["换机转化率", "复购收入占比"], risks: ["设备太耐用，换机意愿低"] },
  A3: { kpis: ["留资转化率", "有效号码率"], risks: ["表单无效号码多", "响应慢导致流失"] },
  A4: { kpis: ["竞品替换成功率"], risks: ["只拿到价格，拿不到真实痛点"] },
  A5: { kpis: ["转介绍成单率"], risks: ["推荐关系没记录，功劳分不清"] },
  B1: { kpis: ["重复线索率"], risks: ["同一客户多名销售撞单"] },
  B2: { kpis: ["A 级占比", "线索转商机率"], risks: ["分级靠感觉，销售不认"] },
  B3: { kpis: ["48h 首触率"], risks: ["分配后没人跟", "销售嫌线索质量差"] },
  C1: { kpis: ["线索转商机率"], risks: ["条件不全就转，商机池虚高"] },
  C2: { kpis: ["必填字段完整率"], risks: ["信息不全，报价阶段返工"] },
  C3: { kpis: ["商机赢率", "资源投入产出比"], risks: ["评审走过场，资源全压大单"] },
  D1: { kpis: ["需求确认及时率"], risks: ["客户说不清要求，方案反复改"] },
  D2: { kpis: ["打样成功率", "打样周期"], risks: ["客户板卡状态差，结论失真"] },
  D3: { kpis: ["方案一次通过率"], risks: ["非标评估不足，报价漏项"] },
  E1: { kpis: ["配置准确率"], risks: ["探针数选少，验收测不全"] },
  E2: { kpis: ["非标工时偏差率"], risks: ["漏项导致后期追成本"] },
  E3: { kpis: ["报价毛利率", "报价周期"], risks: ["为抢单压价，毛利击穿底线"] },
  E4: { kpis: ["版本错发率"], risks: ["客户拿旧版报价来签约"] },
  F1: { kpis: ["合同额", "平均折扣率"], risks: ["口头承诺没写进合同"] },
  F2: { kpis: ["合同评审一次通过率"], risks: ["验收标准模糊，FAT/SAT 扯皮"] },
  F3: { kpis: ["预收到账及时率"], risks: ["未收款先投产，现金流吃紧"] },
  F4: { kpis: ["资料齐套率"], risks: ["技术协议没随单移交"] }
};
MODEL.filter(p => p.id === "P1").forEach(p =>
  p.segments.forEach(s => s.steps.forEach(st => Object.assign(st, P1_METRICS[st.id] || {}))));

/* ============ 第 9 阶段：财务与成本（横贯阶段，按金蝶云星空模块组织） ============ */
MODEL.push({
  id: "P9", name: "财务与成本", color: "#4338ca",
  goal: "从接单就开始产生数据：应收、应付、存货、成本、总账、税、资金 —— 钱怎么算、怎么收、怎么付",
  crossCutting: true,
  matrix: {
    modules: ["应收款管理", "发票云", "应付款管理", "存货核算", "实际成本", "总账", "报表系统", "资金管理"],
    segs: ["G", "H", "I", "J", "K", "L", "M"],
    // full=主责产生单据  part=读取/被引用  none=不涉及
    marks: {
      "应收款管理": ["full", "none", "none", "none", "part", "none", "part"],
      "发票云":     ["full", "part", "none", "none", "part", "full", "none"],
      "应付款管理": ["none", "full", "part", "part", "part", "part", "part"],
      "存货核算":   ["none", "part", "full", "part", "part", "none", "none"],
      "实际成本":   ["none", "none", "part", "full", "part", "none", "none"],
      "总账":       ["part", "part", "part", "part", "full", "part", "part"],
      "报表系统":   ["none", "none", "none", "part", "full", "none", "none"],
      "资金管理":   ["part", "part", "none", "none", "none", "none", "full"]
    }
  },
  segments: [
    { id: "G", name: "应收与开票", goal: "一台设备从预收到质保金，钱分几笔、按什么节点收",
      steps: [
        { id: "G1", name: "预收款登记", module: "应收款管理", who: ["财务", "商务"], inputs: ["合同付款条款", "银行回单"], actions: ["核对预收比例并登记"], outputs: ["收款单（预收）"], systems: ["应收款管理"], judge: "预收 ≥ 30%，未到账不投产", ai: "可自动", aiNote: "识别回单、自动匹配合同号", kpis: ["预收到账及时率"], risks: ["未收款先投产，现金流吃紧"] },
        { id: "G2", name: "发货确认与开票申请", module: "应收款管理", who: ["财务"], inputs: ["发货单", "合同验收节点"], actions: ["判断开票时点并发起申请"], outputs: ["开票申请单"], systems: ["应收款管理", "发票云"], judge: "发货单已审核且金额一致", ai: "可自动", aiNote: "按发货单自动生成申请", kpis: ["开票及时率"], risks: ["发货与开票脱节导致漏确认收入"] },
        { id: "G3", name: "销项发票开具", module: "发票云", who: ["财务"], inputs: ["开票申请单", "客户抬头与税号"], actions: ["开具发票并回写单号"], outputs: ["增值税发票"], systems: ["发票云"], judge: "抬头 / 税号 / 税率 / 金额正确", ai: "可辅助", aiNote: "票面信息校验、批量开票", kpis: ["退票率"], risks: ["抬头错误导致退票重开"] },
        { id: "G4", name: "应收单生成", module: "应收款管理", who: ["财务"], inputs: ["合同付款节点", "验收单"], actions: ["按节点生成应收单"], outputs: ["应收单"], systems: ["应收款管理"], judge: "收入确认节点是否满足", ai: "可自动", aiNote: "按验收单自动生成", kpis: ["应收余额准确率"], risks: ["提前确认收入"] },
        { id: "G5", name: "收款核销", module: "应收款管理", who: ["财务"], inputs: ["银行流水", "应收单"], actions: ["匹配核销"], outputs: ["核销单"], systems: ["应收款管理"], judge: "金额与客户匹配", ai: "可辅助", aiNote: "流水与应收单智能匹配", kpis: ["未核销占比"], risks: ["一笔款多单匹配错误"] },
        { id: "G6", name: "账龄分析与逾期催收", module: "应收款管理", who: ["财务", "销售"], inputs: ["应收台账", "账期"], actions: ["按账龄分组并催收"], outputs: ["账龄分析表"], systems: ["应收款管理"], judge: "超 60 天预警并升级", ai: "可自动", aiNote: "自动生成催收清单", kpis: ["DSO", "逾期占比"], risks: ["质保金到期无人跟进"] }
      ]},
    { id: "H", name: "应付与采购结算", goal: "三单匹配、暂估、外协结算、付款计划",
      steps: [
        { id: "H1", name: "入库暂估", module: "应付款管理", who: ["财务", "仓管"], inputs: ["入库单", "未到票清单"], actions: ["月末按暂估价入账"], outputs: ["暂估应付单"], systems: ["应付款管理"], judge: "暂估口径一致、次月冲回", ai: "可自动", aiNote: "自动生成暂估与冲回", kpis: ["暂估准确率"], risks: ["暂估不冲回导致重复计成本"] },
        { id: "H2", name: "三单匹配", module: "应付款管理", who: ["财务", "采购"], inputs: ["采购订单", "入库单", "发票"], actions: ["数量与金额逐项比对"], outputs: ["匹配结果"], systems: ["应付款管理"], judge: "三单数量金额一致", ai: "可辅助", aiNote: "差异自动标红并给出原因", kpis: ["匹配通过率"], risks: ["单价差异未处理直接付款"] },
        { id: "H3", name: "应付单与发票入账", module: "发票云", who: ["财务"], inputs: ["匹配结果", "进项发票"], actions: ["生成应付单并入账"], outputs: ["应付单"], systems: ["应付款管理", "发票云"], judge: "税率与合同一致", ai: "可自动", aiNote: "发票查验与入账", kpis: ["应付准确率"], risks: ["进项票未认证"] },
        { id: "H4", name: "付款申请与审批", module: "应付款管理", who: ["采购", "财务", "总经理"], inputs: ["应付单", "合同账期"], actions: ["按账期排付款计划并审批"], outputs: ["付款申请单"], systems: ["应付款管理"], judge: "账期与资金计划匹配", ai: "可辅助", aiNote: "到期提醒与优先级建议", kpis: ["准时付款率"], risks: ["超账期影响供应"] },
        { id: "H5", name: "外协加工结算", module: "存货核算", who: ["采购", "财务"], inputs: ["外协订单", "回厂检验单"], actions: ["按合格数量结算"], outputs: ["外协结算单"], systems: ["应付款管理", "存货核算"], judge: "只按合格品结算", ai: "可自动", aiNote: "数量与检验结果自动核对", kpis: ["外协成本占比"], risks: ["报废品也照单结算"] }
      ]},
    { id: "I", name: "存货核算", goal: "出入库成本、计价方式、月末结账 —— 成本核算的地基",
      steps: [
        { id: "I1", name: "入库成本归集", module: "存货核算", who: ["财务", "仓管"], inputs: ["入库单", "采购发票"], actions: ["确定入库单价"], outputs: ["入库成本"], systems: ["存货核算"], judge: "计价方法与政策一致", ai: "可自动", aiNote: "自动取价与差异提示", kpis: ["入库成本准确率"], risks: ["暂估与实价差异未调整"] },
        { id: "I2", name: "出库成本计算", module: "存货核算", who: ["财务"], inputs: ["领料单", "发货单"], actions: ["按计价方法出库"], outputs: ["出库成本"], systems: ["存货核算"], judge: "计价方法（加权平均 / 个别计价）", ai: "可自动", aiNote: "自动计价", kpis: ["出库成本准确率"], risks: ["计价方法选错，成本整体失真"] },
        { id: "I3", name: "月末存货结账", module: "存货核算", who: ["财务"], inputs: ["全部出入库单据"], actions: ["检查未记账单据后结账"], outputs: ["结账记录"], systems: ["存货核算"], judge: "单据全部记账", ai: "可自动", aiNote: "未记账清单自动推送", kpis: ["结账及时率（月结天数）"], risks: ["漏单导致成本失真"] },
        { id: "I4", name: "盘点与差异调整", module: "存货核算", who: ["财务", "仓管"], inputs: ["盘点表"], actions: ["盘盈盘亏调整并追原因"], outputs: ["盘点差异单"], systems: ["存货核算"], judge: "差异原因明确后才调账", ai: "可辅助", aiNote: "差异归因建议", kpis: ["账实相符率"], risks: ["差异直接调成本，掩盖管理问题"] },
        { id: "I5", name: "在制与完工结转", module: "实际成本", who: ["财务"], inputs: ["生产订单", "报工记录"], actions: ["结转完工入库成本"], outputs: ["结转凭证"], systems: ["存货核算", "实际成本"], judge: "完工数量与报工一致", ai: "可自动", aiNote: "自动生成结转", kpis: ["在制余额合理性"], risks: ["在制长期挂账不清"] }
      ]},
    { id: "J", name: "成本核算", goal: "项目成本归集：料、工、费怎么摊，完工与在制怎么分",
      steps: [
        { id: "J1", name: "成本对象设定", module: "实际成本", who: ["财务", "项目经理"], inputs: ["项目号", "机台号"], actions: ["设定成本对象与归集口径"], outputs: ["成本对象档案"], systems: ["实际成本"], judge: "一个项目 = 一个成本对象", ai: "只能人做", aiNote: "", kpis: ["对象覆盖率"], risks: ["对象混乱导致串成本"] },
        { id: "J2", name: "直接材料归集", module: "实际成本", who: ["财务"], inputs: ["领料单", "BOM"], actions: ["按项目号归集材料"], outputs: ["材料成本"], systems: ["实际成本"], judge: "领料是否挂项目号", ai: "可自动", aiNote: "按项目自动汇总", kpis: ["材料占比"], risks: ["共用料未分摊到项目"] },
        { id: "J3", name: "直接人工归集", module: "实际成本", who: ["财务", "生产"], inputs: ["报工工时", "人工费率"], actions: ["计算人工成本"], outputs: ["人工成本"], systems: ["实际成本"], judge: "工时记录完整", ai: "可辅助", aiNote: "工时异常提醒", kpis: ["工时偏差率"], risks: ["报工不及时，人工成本滞后"] },
        { id: "J4", name: "制造费用分配", module: "实际成本", who: ["财务"], inputs: ["费用归集", "分配标准"], actions: ["按工时 / 机时分配"], outputs: ["制造费用"], systems: ["实际成本"], judge: "分配标准是否合理", ai: "可辅助", aiNote: "多方案测算对比", kpis: ["费用分配率"], risks: ["分配标准拍脑袋，成本失真"] },
        { id: "J5", name: "外协与专项费用计入", module: "实际成本", who: ["财务"], inputs: ["外协结算单", "差旅与现场费用"], actions: ["计入对应项目成本"], outputs: ["专项成本"], systems: ["实际成本"], judge: "费用归属项目准确", ai: "可辅助", aiNote: "按项目号自动归集", kpis: ["专项费用占比"], risks: ["现场费用不归集，毛利虚高"] },
        { id: "J6", name: "完工与在制分配", module: "实际成本", who: ["财务"], inputs: ["完工数量", "约当产量"], actions: ["计算完工与在制成本"], outputs: ["成本计算单"], systems: ["实际成本"], judge: "约当产量是否合理", ai: "只能人做", aiNote: "", kpis: ["在制余额波动"], risks: ["完工比例随意定"] },
        { id: "J7", name: "成本还原与毛利分析", module: "报表系统", who: ["财务", "销售"], inputs: ["成本计算单", "报价单"], actions: ["还原料工费并对比报价"], outputs: ["项目毛利表"], systems: ["报表系统"], judge: "毛利率与报价偏差是否可解释", ai: "可辅助", aiNote: "偏差归因", kpis: ["项目毛利率", "偏差率"], risks: ["毛利虚高，报价策略失准"] }
      ]},
    { id: "K", name: "总账与报表", goal: "单据转凭证、期末结转、三大报表",
      steps: [
        { id: "K1", name: "业务单据生成凭证", module: "总账", who: ["财务"], inputs: ["应收 / 应付 / 存货 / 成本单据"], actions: ["按凭证模板生成"], outputs: ["记账凭证"], systems: ["总账"], judge: "科目映射是否正确", ai: "可自动", aiNote: "模板匹配与异常拦截", kpis: ["自动生成率"], risks: ["科目映射错误，报表全错"] },
        { id: "K2", name: "凭证审核与过账", module: "总账", who: ["财务主管"], inputs: ["记账凭证"], actions: ["审核后过账"], outputs: ["已过账凭证"], systems: ["总账"], judge: "借贷平衡、附件齐全", ai: "可辅助", aiNote: "异常凭证提示", kpis: ["凭证差错率"], risks: ["手工凭证不规范"] },
        { id: "K3", name: "期末结转与关账", module: "总账", who: ["财务"], inputs: ["各模块结账状态"], actions: ["结转损益并关账"], outputs: ["关账记录"], systems: ["总账"], judge: "各模块均已结账", ai: "可自动", aiNote: "关账前置检查清单", kpis: ["月结天数"], risks: ["模块未结账强行关账"] },
        { id: "K4", name: "三大报表编制", module: "报表系统", who: ["财务"], inputs: ["总账余额"], actions: ["编制资产负债表 / 利润表 / 现金流量表"], outputs: ["财务报表"], systems: ["报表系统"], judge: "勾稽关系正确", ai: "可自动", aiNote: "自动取数并校验勾稽", kpis: ["报表出具时间"], risks: ["现金流量表靠手工拼"] },
        { id: "K5", name: "管理报表与项目毛利", module: "报表系统", who: ["财务", "管理层"], inputs: ["项目毛利", "成本明细"], actions: ["输出经营分析"], outputs: ["管理报表"], systems: ["报表系统"], judge: "口径与业务一致", ai: "可辅助", aiNote: "多维分析", kpis: ["分析覆盖率"], risks: ["报表口径与业务口径两张皮"] }
      ]},
    { id: "L", name: "税务与发票", goal: "进项认证、销项合规、申报与税负",
      steps: [
        { id: "L1", name: "进项发票认证", module: "发票云", who: ["财务"], inputs: ["进项发票"], actions: ["勾选认证"], outputs: ["认证清单"], systems: ["发票云"], judge: "票面信息准确", ai: "可自动", aiNote: "批量勾选", kpis: ["认证及时率"], risks: ["逾期未认证，损失抵扣"] },
        { id: "L2", name: "销项与开票合规", module: "发票云", who: ["财务"], inputs: ["开票申请"], actions: ["校验税收分类编码与税率"], outputs: ["合规发票"], systems: ["发票云"], judge: "税收分类编码正确", ai: "可辅助", aiNote: "编码推荐", kpis: ["作废率"], risks: ["编码错误被稽查"] },
        { id: "L3", name: "增值税申报", module: "总账", who: ["财务"], inputs: ["销项 / 进项数据"], actions: ["计算应纳税额并申报"], outputs: ["申报表"], systems: ["税务管理"], judge: "与账载数据一致", ai: "可辅助", aiNote: "账税差异比对", kpis: ["申报准确率"], risks: ["账税差异无人解释"] },
        { id: "L4", name: "税负分析与筹划", module: "报表系统", who: ["财务"], inputs: ["申报数据", "行业税负"], actions: ["分析税负并提筹划建议"], outputs: ["税负分析报告"], systems: ["税务管理"], judge: "税负是否在合理区间", ai: "可辅助", aiNote: "行业对标", kpis: ["税负率"], risks: ["只申报不分析"] }
      ]},
    { id: "M", name: "资金与预算", goal: "资金计划、收付款排程、银行对账、预算控制",
      steps: [
        { id: "M1", name: "资金计划编制", module: "资金管理", who: ["财务"], inputs: ["应收 / 应付排程"], actions: ["编制滚动资金计划"], outputs: ["资金计划"], systems: ["资金管理"], judge: "覆盖未来 3 个月", ai: "可辅助", aiNote: "按合同与账期预测", kpis: ["计划准确率"], risks: ["计划与实际两张皮"] },
        { id: "M2", name: "收付款排程", module: "资金管理", who: ["财务"], inputs: ["到期应收应付"], actions: ["排定优先级"], outputs: ["收付款排程"], systems: ["资金管理"], judge: "现金流不断裂", ai: "可自动", aiNote: "缺口提前预警", kpis: ["资金缺口预警次数"], risks: ["集中付款导致缺口"] },
        { id: "M3", name: "银行对账", module: "资金管理", who: ["财务"], inputs: ["银行流水"], actions: ["逐笔对账"], outputs: ["余额调节表"], systems: ["资金管理"], judge: "账实一致", ai: "可自动", aiNote: "流水自动匹配", kpis: ["未达账项金额"], risks: ["长期未达账项"] },
        { id: "M4", name: "预算控制与偏差分析", module: "资金管理", who: ["财务"], inputs: ["预算", "实际发生"], actions: ["控制超预算并分析偏差"], outputs: ["预算执行表"], systems: ["预算管理"], judge: "超预算需审批", ai: "可辅助", aiNote: "偏差归因", kpis: ["预算偏差率"], risks: ["预算外支出失控"] }
      ]}
  ]
});

/* ============ V3 业务全景：由现有数据派生 + 少量编辑性摘要 ============ */
/* 阶段的一句话摘要与关键输入输出（编辑内容，不改阶段本身） */
const PHASE_IO = {
  P1: { core: "找线索 → 报价 → 签约", in: "客户线索 / 板卡需求", out: "销售订单 / 合同" },
  P2: { core: "能不能做、赚不赚钱、来不来得及", in: "销售订单 / 技术协议", out: "评审记录 / 项目主计划" },
  P3: { core: "图纸、BOM、软件与探针配置", in: "技术协议 / 客户样品", out: "图纸 / BOM / 软件版本" },
  P4: { core: "齐套：计划、采购、来料检验", in: "主计划 / BOM", out: "采购订单 / 入库与检验记录" },
  P5: { core: "装出来，调到承诺的精度", in: "物料 / 图纸 / 探针", out: "标定记录 / 测试数据" },
  P6: { core: "FAT 签字放行", in: "内部测试数据", out: "FAT 报告 / 发运放行单" },
  P7: { core: "现场安装、SAT 验收、培训移交", in: "发货单", out: "SAT 验收单" },
  P8: { core: "回款 + 长期服务", in: "验收单 / 客户请求", out: "应收 / 服务工单" },
  P9: { core: "横贯：应收应付、存货成本、总账报表、税与资金", in: "各阶段产生的业务单据", out: "凭证 / 报表 / 成本" }
};

/* 关键单据流：只取有真实产出依据的节点，不硬串 */
const BILL_FLOW = [
  { label: "商机记录", step: "C1" },
  { label: "需求确认单", step: "D1" },
  { label: "报价单", step: "E4" },
  { label: "合同", step: "F3" },
  { label: "销售订单", step: "S04" },
  { label: "BOM", step: "S06" },
  { label: "采购申请 / PO", step: "S10" },
  { label: "入库与检验", step: "S11" },
  { label: "生产工单", step: "S12" },
  { label: "测试数据", step: "S14" },
  { label: "FAT 报告", step: "S15" },
  { label: "发货单", step: "S16" },
  { label: "SAT 验收单", step: "S17" },
  { label: "应收单", step: "G4" },
  { label: "成本计算单", step: "J6" }
];

/* 核心业务流程（商机 → 交付）：主线 + 条件分支 + 回退。
   注意：这是【研究/示意】流程，不代表某家公司的实际审批路径。 */
const CORE_FLOW = {
  main: [
    { id: "n1", label: "商机立项", sub: "C1", step: "C1" },
    { id: "n2", label: "需求澄清", sub: "D1", step: "D1" },
    { id: "n3", label: "打样测试", sub: "D2", step: "D2" },
    { id: "n4", label: "方案与报价", sub: "E1–E3", step: "E3" },
    { id: "n5", label: "合同评审", sub: "F2", step: "F2" },
    { id: "n6", label: "订单评审", sub: "S04", step: "S04" },
    { id: "n7", label: "装配与调试", sub: "S12–S13", step: "S12" },
    { id: "n8", label: "FAT 验收", sub: "S15", step: "S15" },
    { id: "n9", label: "SAT 与回款", sub: "S17 / G4", step: "S17" }
  ],
  branches: [
    { from: "n3", label: "打样不通过", to: null, node: { id: "b1", label: "技术不可行", sub: "D3", step: "D3" } },
    { from: "n5", label: "条款不通过", node: { id: "b2", label: "回谈判", sub: "F1", step: "F1" }, back: "n4" },
    { from: "n6", label: "非标未识别", node: { id: "b3", label: "回技术评估", sub: "D3", step: "D3" }, back: "n4" },
    { from: "n8", label: "FAT 不通过", node: { id: "b4", label: "返工复测", sub: "S14", step: "S14" }, back: "n7" }
  ],
  // 条件分支：报价被拒返回方案调整
  returns: [{ from: "n4", label: "客户不接受报价 → 回方案调整", to: "n4" }]
};
