// --- 配置部分 ---
const conceptDefinitions = {
    "人才": { color: "#FF9999", displayLabel: "人才" },
    "高校": { color: "#99CCFF", displayLabel: "高校" },
    "单位": { color: "#99FF99", displayLabel: "工作单位" },
    "城市": { color: "#FFCC99", displayLabel: "城市" },
    "技能": { color: "#FF99CC", displayLabel: "技能" },
    "项目": { color: "#99FFCC", displayLabel: "算力项目" },
    "专业领域": { color: "#CCFF99", displayLabel: "专业领域" },
    "算力工作年限": { color: "#CCCCFF", displayLabel: "算力工作年限" },
    "算力类型": { color: "#FFCCFF", displayLabel: "算力类型" },
    "合作对象": { color: "#CCFFFF", displayLabel: "合作对象" }
};

const relationDefinitions = {
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

// 存储原始数据
let originalNodesMap = new Map();
let originalEdgesArray = [];
let allNodeIds = []; // 用于按比例选择

// 用于存储当前显示的数据集
let currentNetworkInstance = null;
let currentNodesDataset = null;
let currentEdgesDataset = null;

// 从 data.json 加载数据
fetch('data.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(neo4jData => {
        console.log("Raw data loaded:", neo4jData);

        // 解析数据
        neo4jData.forEach(item => {
            const nodeN = item.n;
            const rel = item.r;
            const nodeM = item.m;

            // --- 处理节点 N ---
            if (!originalNodesMap.has(nodeN.elementId)) {
                const nodeLabel = nodeN.labels[0];
                const config = conceptDefinitions[nodeLabel] || { color: "#CCCCCC", displayLabel: nodeLabel };
                originalNodesMap.set(nodeN.elementId, {
                    id: nodeN.elementId,
                    label: nodeN.properties.name || nodeN.elementId,
                    color: config.color,
                    title: `ID: ${nodeN.elementId}\n类型: ${config.displayLabel}\n名称: ${nodeN.properties.name || 'N/A'}\n属性: ${JSON.stringify(nodeN.properties, null, 2) || 'N/A'}`
                });
                allNodeIds.push(nodeN.elementId); // 收集所有节点ID
            }

            // --- 处理节点 M ---
            if (!originalNodesMap.has(nodeM.elementId)) {
                const nodeLabel = nodeM.labels[0];
                const config = conceptDefinitions[nodeLabel] || { color: "#CCCCCC", displayLabel: nodeLabel };
                originalNodesMap.set(nodeM.elementId, {
                    id: nodeM.elementId,
                    label: nodeM.properties.name || nodeM.elementId,
                    color: config.color,
                    title: `ID: ${nodeM.elementId}\n类型: ${config.displayLabel}\n名称: ${nodeM.properties.name || 'N/A'}\n属性: ${JSON.stringify(nodeM.properties, null, 2) || 'N/A'}`
                });
                allNodeIds.push(nodeM.elementId);
            }

            // --- 添加边 ---
            const relConfig = relationDefinitions[rel.type] || { displayLabel: rel.type };
            originalEdgesArray.push({
                from: nodeN.elementId,
                to: nodeM.elementId,
                label: relConfig.displayLabel,
                arrows: 'to',
                title: `关系: ${relConfig.displayLabel}\nID: ${rel.elementId}\n属性: ${JSON.stringify(rel.properties, null, 2) || 'N/A'}`
            });
        });

        console.log("All Node IDs:", allNodeIds);
        console.log("Original Nodes Count:", originalNodesMap.size);
        console.log("Original Edges Count:", originalEdgesArray.length);

        // 初始化图谱，显示全部
        initializeGraph();
    })
    .catch(error => {
        console.error('Error fetching or processing ', error);
        document.getElementById('mynetwork').innerHTML = `<p style="color: red; text-align: center;">加载数据失败: ${error.message}</p>`;
    });

function initializeGraph() {
    // 创建初始数据集（全部节点和边）
    currentNodesDataset = new vis.DataSet(Array.from(originalNodesMap.values()));
    currentEdgesDataset = new vis.DataSet(originalEdgesArray);

    const container = document.getElementById('mynetwork');
    const data = {
        nodes: currentNodesDataset,
        edges: currentEdgesDataset
    };

    const options = getVisOptions(); // 获取统一的配置

    currentNetworkInstance = new vis.Network(container, data, options);

    // 监听物理引擎稳定事件，稳定后禁用物理引擎
    currentNetworkInstance.on("stabilizationIterationsDone", function () {
        console.log("Layout stabilization done. Disabling physics.");
        currentNetworkInstance.setOptions({ physics: { enabled: false } });
    });
}

function getVisOptions() {
    return {
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
            enabled: true,
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
                gravitationalConstant: -100,
                springLength: 250,
                centralGravity: 0.005,
                damping: 0.4,
                avoidOverlap: 1
            },
            stabilization: {
                enabled: true,
                iterations: 1500,
                updateInterval: 25,
                onlyDynamicEdges: false,
                fit: true
            }
        },
        interaction: {
            tooltipDelay: 200,
            hideEdgesOnDrag: false,
            selectConnectedEdges: true,
            dragNodes: true,
            dragView: true,
            zoomView: true
        },
        layout: {
            improvedLayout: true
        }
    };
}

// --- 按比例展示函数 ---
function showPercentage(percent) {
    if (!currentNetworkInstance || allNodeIds.length === 0) return;

    const numNodesToShow = Math.floor((percent / 100) * allNodeIds.length);
    // 随机选择指定数量的节点ID
    const shuffledIds = [...allNodeIds].sort(() => 0.5 - Math.random());
    const selectedNodeIds = new Set(shuffledIds.slice(0, numNodesToShow));

    // 找到与这些节点相关的边
    const relevantEdges = originalEdgesArray.filter(edge => 
        selectedNodeIds.has(edge.from) && selectedNodeIds.has(edge.to)
    );

    // 获取这些边涉及的所有节点ID（可能比selectedNodeIds多，因为边的两端都在selectedNodeIds中）
    // 但在当前逻辑下，relevantEdges的from和to都在selectedNodeIds里，所以节点集就是selectedNodeIds
    // 如果需要显示边连接到未被选中节点的情况，则需要更复杂的逻辑
    // 当前逻辑：只显示 selectedNodeIds 中的节点和它们之间的边
    const relevantNodes = Array.from(originalNodesMap.values()).filter(node => 
        selectedNodeIds.has(node.id)
    );

    console.log(`Showing ${percent}%: ${relevantNodes.length} nodes, ${relevantEdges.length} edges`);

    // 更新图谱数据
    currentNetworkInstance.setData({
        nodes: new vis.DataSet(relevantNodes),
        edges: new vis.DataSet(relevantEdges)
    });
    currentNetworkInstance.fit(); // 适应新视图
    // 重新启用物理引擎进行布局计算
    currentNetworkInstance.setOptions({ physics: getVisOptions().physics });
}

// --- 分类展示函数 ---
function showByLabel(label) {
    if (!currentNetworkInstance) return;

    // 找到指定标签的节点ID
    const selectedNodeIds = new Set();
    originalNodesMap.forEach((node, id) => {
        if (node.label === label || conceptDefinitions[node.label]?.displayLabel === label) {
            selectedNodeIds.add(id);
        }
    });

    // 找到连接这些节点的边
    const relevantEdges = originalEdgesArray.filter(edge => 
        selectedNodeIds.has(edge.from) && selectedNodeIds.has(edge.to)
    );

    // 获取这些边涉及的节点（与按比例逻辑相同）
    const relevantNodes = Array.from(originalNodesMap.values()).filter(node => 
        selectedNodeIds.has(node.id)
    );

    console.log(`Showing by label '${label}': ${relevantNodes.length} nodes, ${relevantEdges.length} edges`);

    // 更新图谱数据
    currentNetworkInstance.setData({
        nodes: new vis.DataSet(relevantNodes),
        edges: new vis.DataSet(relevantEdges)
    });
    currentNetworkInstance.fit();
    // 重新启用物理引擎进行布局计算
    currentNetworkInstance.setOptions({ physics: getVisOptions().physics });
}

// --- 控制函数 ---
function fitToScreen() {
    if (currentNetworkInstance) {
        currentNetworkInstance.fit();
    }
}

// 页面加载完成后初始化按钮文本
window.addEventListener('load', function() {
    // 按钮事件监听器在HTML中定义，这里无需再次添加
});