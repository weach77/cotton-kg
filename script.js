// --- 配置部分 ---
// 从概念定义中获取节点颜色和标签映射
const conceptDefinitions = {
    // 从您提供的概念列表中解析
    "人才": { color: "#FF9999", displayLabel: "人才" },
    "高校": { color: "#99CCFF", displayLabel: "高校" },
    "单位": { color: "#99FF99", displayLabel: "工作单位" }, // 注意：您的JSON中关系range是"单位"
    "城市": { color: "#FFCC99", displayLabel: "城市" },
    "技能": { color: "#FF99CC", displayLabel: "技能" },
    "项目": { color: "#99FFCC", displayLabel: "算力项目" },
    "专业领域": { color: "#CCFF99", displayLabel: "专业领域" },
    "算力工作年限": { color: "#CCCCFF", displayLabel: "算力工作年限" },
    "算力类型": { color: "#FFCCFF", displayLabel: "算力类型" },
    "合作对象": { color: "#CCFFFF", displayLabel: "合作对象" }
};

// 从关系定义中获取关系显示标签
const relationDefinitions = {
    // 从您提供的关系列表中解析
    "毕业于": { displayLabel: "毕业于" },
    "就职于": { displayLabel: "就职于" },
    "所在城市": { displayLabel: "所在城市" },
    "掌握技能": { displayLabel: "掌握技能" },
    "参与项目": { displayLabel: "参与项目" },
    "具备专业领域": { displayLabel: "具备专业领域" },
    "拥有": { displayLabel: "拥有" },
    "熟悉算力类型": { displayLabel: "熟悉算力类型" },
    "合作于": { displayLabel: "合作于" }
};

// 存储所有唯一节点
const allNodes = new Map();
// 存储所有边
const allEdges = [];

// 从 data.json 加载数据
fetch('data.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(neo4jData => {
        console.log("Raw data loaded:", neo4jData); // 调试用

        // 遍历每个路径对象 (n, r, m)
        neo4jData.forEach(item => {
            const nodeN = item.n;
            const rel = item.r;
            const nodeM = item.m;

            // --- 处理节点 N ---
            if (!allNodes.has(nodeN.elementId)) {
                const nodeLabel = nodeN.labels[0];
                const config = conceptDefinitions[nodeLabel] || { color: "#CCCCCC", displayLabel: nodeLabel }; // 默认颜色和标签
                allNodes.set(nodeN.elementId, {
                    id: nodeN.elementId,
                    label: nodeN.properties.name || nodeN.elementId, // 优先使用 name 属性
                    color: config.color,
                    title: `ID: ${nodeN.elementId}\n类型: ${config.displayLabel}\n名称: ${nodeN.properties.name || 'N/A'}\n属性: ${JSON.stringify(nodeN.properties, null, 2) || 'N/A'}`
                });
            }

            // --- 处理节点 M ---
            if (!allNodes.has(nodeM.elementId)) {
                const nodeLabel = nodeM.labels[0];
                const config = conceptDefinitions[nodeLabel] || { color: "#CCCCCC", displayLabel: nodeLabel };
                allNodes.set(nodeM.elementId, {
                    id: nodeM.elementId,
                    label: nodeM.properties.name || nodeM.elementId,
                    color: config.color,
                    title: `ID: ${nodeM.elementId}\n类型: ${config.displayLabel}\n名称: ${nodeM.properties.name || 'N/A'}\n属性: ${JSON.stringify(nodeM.properties, null, 2) || 'N/A'}`
                });
            }

            // --- 添加边 ---
            const relConfig = relationDefinitions[rel.type] || { displayLabel: rel.type }; // 默认显示关系类型
            allEdges.push({
                from: nodeN.elementId,
                to: nodeM.elementId,
                label: relConfig.displayLabel, // 使用定义中的显示标签
                arrows: 'to', // 箭头指向目标节点
                title: `关系: ${relConfig.displayLabel}\nID: ${rel.elementId}\n属性: ${JSON.stringify(rel.properties, null, 2) || 'N/A'}`
            });
        });

        // 转换为 vis.js 需要的格式
        const nodesArray = Array.from(allNodes.values());
        const edgesArray = allEdges;

        console.log("Processed nodes:", nodesArray); // 调试用
        console.log("Processed edges:", edgesArray); // 调试用

        drawGraph(nodesArray, edgesArray);
    })
    .catch(error => {
        console.error('Error fetching or processing ', error);
        document.getElementById('mynetwork').innerHTML = `<p style="color: red; text-align: center;">加载数据失败: ${error.message}</p>`;
    });

function drawGraph(nodes, edges) {
    const container = document.getElementById('mynetwork');
    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    const options = {
        nodes: {
            shape: 'dot',
            size: 25,
            font: {
                size: 14,
                face: 'verdana'
            },
            borderWidth: 2,
            chosen: {
                node: function(values, id, selected, hovering) {
                    values.color = 'rgba(255, 165, 0, 1)';
                }
            }
        },
        edges: {
            width: 2,
            font: {
                size: 12,
                align: 'middle',
                color: 'black'
            },
            color: {
                color: 'lightgray',
                highlight: 'blue',
                hover: 'blue'
            },
            smooth: {
                type: 'dynamic'
            },
            chosen: {
                edge: function(values, id, selected, hovering) {
                    values.color = 'blue';
                    values.width = 3;
                }
            }
        },
        physics: {
            enabled: true, // 启用物理引擎
            barnesHut: {
                gravitationalConstant: -10000, // 增加斥力
                centralGravity: 0.1,          // 降低向中心的引力
                springLength: 300,            // 增加弹簧长度
                springConstant: 0.04,         // 降低弹簧常数，使连接更松弛
                damping: 0.09                 // 增加阻尼，减少震荡
            },
            stabilization: {
                iterations: 1000,             // 增加稳定迭代次数
                fit: true
            }
        },
        interaction: {
            tooltipDelay: 200,
            hideEdgesOnDrag: true,          // 拖拽时隐藏边以提高性能
            selectConnectedEdges: true,
            dragNodes: true,
            dragView: true,
            zoomView: true
        },
        layout: {
            improvedLayout: true,
            clusterThreshold: 150,          // 增加聚类阈值
            randomSeed: undefined,          // 使每次布局随机
            hierarchical: {
                enabled: false              // 禁用层次布局
            }
        }
    };

    const network = new vis.Network(container, data, options);
    window.networkInstance = network;

    // 等待布局稳定后，禁用物理引擎
    network.once('stabilized', function() {
        setTimeout(function() {
            network.setOptions({ physics: { enabled: false } });
        }, 1000); // 等待1秒后禁用物理引擎
    });

    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const node = allNodes.get(nodeId);
            if (node) {
                console.log("Clicked Node Details:", node);
            }
        }
        if (params.edges.length > 0) {
            const edgeId = params.edges[0];
            const edge = edges.find(e => e.id === edgeId);
            if (edge) {
                console.log("Clicked Edge Details:", edge);
            }
        }
    });
}

// 控制函数
function fitToScreen() {
    if (window.networkInstance) {
        window.networkInstance.fit();
    }
}

// 页面加载完成后初始化按钮文本
window.addEventListener('load', function() {
    // 如果HTML中有按钮需要初始状态，可以在这里设置
    // 例如，如果启用了物理引擎的按钮，这里可以隐藏或禁用
});