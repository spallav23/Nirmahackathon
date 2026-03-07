import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  runPrediction,
  getAISummary,
  getModels,
  scheduleInspection,
  getInverterRawHistory,
  getInverterIds,
} from "../services/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const InverterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(id || "");
  const currentInverterId = id || "Select an Inverter";

  const [telemetry, setTelemetry] = useState({
    inverter_power: 0.0,
    pv1_power: 0.0,
    energy_total: 0.0,
    power_factor: 0.0,
    inverters_limit_percent: 0.0,
    inverters_alarm_code: 0.0,
    grid_frequency: 0.0,
    meters_meter_kwh_import: 0.0,
    pv1_voltage: 0.0,
    ambient_temperature: 0.0,
    inverters_kwh_midnight: 0.0,
    grid_power: 0.0,
    pv2_power: 0.0,
    inverter_temp: 0.0,
    meters_meter_kwh_total: 0.0,
    pv2_voltage: 0.0,
    pv2_current: 0.0,
    inverters_op_state: 0.0,
    energy_today: 0.0,
    pv1_current: 0.0,
    pv3_current: 0.0,
    smu_total_current: 0.0,
    smu_mean_current: 0.0,
    smu_std_current: 0.0,
    total_dc_power: 0.0,
    efficiency: 0.0,
    temp_difference: 0.0,
    hour_of_day: 0.0,
    day_of_week: 0.0,
    rolling_mean_power_24h: 0.0,
    rolling_std_power_24h: 0.0,
    failure_label: 0.0,
    inverter_power_rolling_mean: 0.0,
    inverter_power_diff: 0.0,
    pv1_power_rolling_mean: 0.0,
    pv1_power_diff: 0.0,
    energy_total_rolling_mean: 0.0,
    energy_total_diff: 0.0,
    power_factor_rolling_mean: 0.0,
    power_factor_diff: 0.0,
    inverters_limit_percent_rolling_mean: 0.0,
    inverters_limit_percent_diff: 0.0,
    inverters_alarm_code_rolling_mean: 0.0,
    inverters_alarm_code_diff: 0.0,
    grid_frequency_rolling_mean: 0.0,
    grid_frequency_diff: 0.0,
    meters_meter_kwh_import_rolling_mean: 0.0,
    meters_meter_kwh_import_diff: 0.0,
    pv1_voltage_rolling_mean: 0.0,
    pv1_voltage_diff: 0.0,
    ambient_temperature_rolling_mean: 0.0,
    ambient_temperature_diff: 0.0,
    inverters_kwh_midnight_rolling_mean: 0.0,
    inverters_kwh_midnight_diff: 0.0,
    grid_power_rolling_mean: 0.0,
    grid_power_diff: 0.0,
    pv2_power_rolling_mean: 0.0,
    pv2_power_diff: 0.0,
    inverter_temp_rolling_mean: 0.0,
    inverter_temp_diff: 0.0,
    meters_meter_kwh_total_rolling_mean: 0.0,
    meters_meter_kwh_total_diff: 0.0,
    pv2_voltage_rolling_mean: 0.0,
    pv2_voltage_diff: 0.0,
    pv2_current_rolling_mean: 0.0,
    pv2_current_diff: 0.0,
    inverters_op_state_rolling_mean: 0.0,
    inverters_op_state_diff: 0.0,
    energy_today_rolling_mean: 0.0,
    energy_today_diff: 0.0,
    pv1_current_rolling_mean: 0.0,
    pv1_current_diff: 0.0,
    pv3_current_rolling_mean: 0.0,
    pv3_current_diff: 0.0,
    smu_total_current_rolling_mean: 0.0,
    smu_total_current_diff: 0.0,
    smu_mean_current_rolling_mean: 0.0,
    smu_mean_current_diff: 0.0,
    smu_std_current_rolling_mean: 0.0,
    smu_std_current_diff: 0.0,
    total_dc_power_rolling_mean: 0.0,
    total_dc_power_diff: 0.0,
    efficiency_rolling_mean: 0.0,
    efficiency_diff: 0.0,
    temp_difference_rolling_mean: 0.0,
    temp_difference_diff: 0.0,
    hour_of_day_rolling_mean: 0.0,
    hour_of_day_diff: 0.0,
    day_of_week_rolling_mean: 0.0,
    day_of_week_diff: 0.0,
    rolling_mean_power_24h_rolling_mean: 0.0,
    rolling_mean_power_24h_diff: 0.0,
    rolling_std_power_24h_rolling_mean: 0.0,
    rolling_std_power_24h_diff: 0.0,
    failure_label_rolling_mean: 0.0,
    failure_label_diff: 0.0,
  });

  const [prediction, setPrediction] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionMessage, setInspectionMessage] = useState({
    text: "",
    type: "",
  });
  const [historyData, setHistoryData] = useState([]);
  const [availableInverters, setAvailableInverters] = useState([]);
  const [batchPredictions, setBatchPredictions] = useState([]);
  const [predictionInverterId, setPredictionInverterId] = useState(id || "");

  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await getModels();
        if (res.data.success) {
          const list = res.data.data.models || [];
          setModels(list);
          const active = list.find((m) => m.active);
          if (active) setSelectedModelId(active.id);
        }
      } catch (err) {
        console.error("Failed to load models for prediction page", err);
      }
    };
    const loadInverters = async () => {
      try {
        const res = await getInverterIds();
        if (res.data.success) {
          setAvailableInverters(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load inverters list");
      }
    };
    loadModels();
    loadInverters();
  }, []);

  // Auto-fetch raw dataset history and populate telemetry on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!id) return;
      try {
        const res = await getInverterRawHistory(id, 48); // Fetch last 48 readings
        if (res.data.success && res.data.data.length > 0) {
          const data = res.data.data;
          setHistoryData(data);

          // Auto-fill form from latest row
          const currentRow = data[data.length - 1];
          const windowSize = 24;
          const windowRows = data.slice(Math.max(0, data.length - windowSize));
          const previousRow =
            data.length > 1 ? data[data.length - 2] : currentRow;

          setTelemetry((prevTelemetry) => {
            const newTelemetry = { ...prevTelemetry };
            for (const key of Object.keys(newTelemetry)) {
              if (currentRow[key] !== undefined) {
                newTelemetry[key] = parseFloat(currentRow[key]) || 0.0;
              }
            }

            for (const key of Object.keys(newTelemetry)) {
              if (key === "failure_label") continue;

              if (key.endsWith("_diff")) {
                const baseKey = key.replace("_diff", "");
                if (
                  currentRow[baseKey] !== undefined &&
                  previousRow[baseKey] !== undefined
                ) {
                  newTelemetry[key] =
                    (parseFloat(currentRow[baseKey]) || 0) -
                    (parseFloat(previousRow[baseKey]) || 0);
                }
              } else if (key.endsWith("_rolling_mean")) {
                const baseKey = key.replace("_rolling_mean", "");
                if (currentRow[baseKey] !== undefined) {
                  let sum = 0;
                  let count = 0;
                  for (const r of windowRows) {
                    if (r[baseKey] !== undefined) {
                      sum += parseFloat(r[baseKey]) || 0;
                      count++;
                    }
                  }
                  newTelemetry[key] =
                    count > 0
                      ? sum / count
                      : parseFloat(currentRow[baseKey]) || 0;
                }
              }
            }
            return newTelemetry;
          });
        }
      } catch (err) {
        console.error("Failed to load inverter raw history", err);
      }
    };
    fetchHistory();
  }, [id]);

  const handleInputChange = (e) => {
    setTelemetry({ ...telemetry, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/inverter/${searchInput.trim()}`);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPrediction(null);
    setSummary("");

    try {
      if (!id) {
        setError("Please provide an Inverter ID first.");
        setLoading(false);
        return;
      }

      // 1. Run ML Prediction
      const predRes = await runPrediction({
        inverterId: predictionInverterId || id,
        modelId: selectedModelId || undefined,
        telemetry: Object.fromEntries(
          Object.entries(telemetry).map(([k, v]) => [k, Number(v)]),
        ),
      });

      if (predRes.data.success) {
        const predData = predRes.data.data;
        setPrediction(predData);

        // 2. Get AI Summary explanation
        try {
          const summaryRes = await getAISummary({
            predictionId: predData._id,
            riskScore: predData.riskScore,
            topFeatures: predData.topFeatures,
            modelOutput: predData.modelOutput,
          });

          if (summaryRes.data.success) {
            setSummary(summaryRes.data.data.summary);
          }
        } catch (summaryErr) {
          // Fallback if summary fails
          console.error("Summary Failed:", summaryErr);
          setSummary(
            "AI Explanation temporarily unavailable. Please refer to risk score and factors.",
          );
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to generate prediction from ML server.",
      );
    }

    setLoading(false);
  };

  const handleDatasetUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      // Dynamically import SheetJS from CDN since we couldn't run npm install
      const XLSX =
        await import("https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs");

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);

          if (json && json.length > 0) {
            setBatchPredictions([]);

            // Group by inverter_id
            const grouped = {};
            for (const row of json) {
              const invIdKey = Object.keys(row).find(
                (k) =>
                  k.toLowerCase() === "inverter_id" ||
                  k.toLowerCase() === "inverterid",
              );
              const invId = invIdKey ? row[invIdKey] : id; // fallback to current page ID
              if (!invId) continue;
              if (!grouped[invId]) grouped[invId] = [];
              grouped[invId].push(row);
            }

            const inverterIdsInCsv = Object.keys(grouped);
            let matchingKeysCount = 0;

            if (inverterIdsInCsv.length > 0) {
              const windowSize = 24;
              const batchPromises = [];

              for (const invId of inverterIdsInCsv) {
                // Sort by datetime if exists
                const timeKey = Object.keys(grouped[invId][0] || {}).find(
                  (k) =>
                    k.toLowerCase().includes("time") ||
                    k.toLowerCase().includes("date"),
                );
                const rows = timeKey
                  ? grouped[invId].sort(
                      (a, b) => new Date(a[timeKey]) - new Date(b[timeKey]),
                    )
                  : grouped[invId];

                const currentRow = rows[rows.length - 1];
                const windowRows = rows.slice(
                  Math.max(0, rows.length - windowSize),
                );
                const previousRow =
                  rows.length > 1 ? rows[rows.length - 2] : currentRow;

                const computedFeatures = {};

                // Base features
                for (const key of Object.keys(telemetry)) {
                  if (currentRow[key] !== undefined) {
                    computedFeatures[key] = parseFloat(currentRow[key]) || 0;
                    matchingKeysCount++;
                  }
                }

                // Engineered features
                for (const key of Object.keys(telemetry)) {
                  if (key === "failure_label") continue;
                  if (key.endsWith("_diff")) {
                    const baseKey = key.replace("_diff", "");
                    if (
                      currentRow[baseKey] !== undefined &&
                      previousRow[baseKey] !== undefined
                    ) {
                      computedFeatures[key] =
                        (parseFloat(currentRow[baseKey]) || 0) -
                        (parseFloat(previousRow[baseKey]) || 0);
                    }
                  } else if (key.endsWith("_rolling_mean")) {
                    const baseKey = key.replace("_rolling_mean", "");
                    if (currentRow[baseKey] !== undefined) {
                      let sum = 0,
                        count = 0;
                      for (const r of windowRows) {
                        if (r[baseKey] !== undefined) {
                          sum += parseFloat(r[baseKey]) || 0;
                          count++;
                        }
                      }
                      computedFeatures[key] =
                        count > 0
                          ? sum / count
                          : parseFloat(currentRow[baseKey]) || 0;
                    }
                  }
                }

                // Update UI form if this is the currently viewed inverter
                if (invId === id) {
                  setTelemetry((prev) => {
                    const newT = { ...prev };
                    for (const k of Object.keys(newT)) {
                      if (computedFeatures[k] !== undefined)
                        newT[k] = computedFeatures[k];
                    }
                    return newT;
                  });
                }

                // Run Prediction
                batchPromises.push(
                  runPrediction({
                    inverterId: invId,
                    modelId: selectedModelId || undefined,
                    telemetry: computedFeatures,
                  })
                    .then((res) => (res.data.success ? res.data.data : null))
                    .catch(() => null),
                );
              }

              if (matchingKeysCount === 0) {
                setError(
                  "No matching columns found in the dataset. Ensure column headers match parameter names.",
                );
              } else {
                setError("");
                const results = await Promise.all(batchPromises);
                const validResults = results.filter((r) => r !== null);
                setBatchPredictions(validResults);

                // Also update current main prediction if it's in the batch
                const mainResult = validResults.find(
                  (r) => r.inverterId === id,
                );
                if (mainResult) {
                  setPrediction(mainResult);
                  // Get summary for main
                  getAISummary({
                    predictionId: mainResult._id,
                    riskScore: mainResult.riskScore,
                    topFeatures: mainResult.topFeatures,
                    modelOutput: mainResult.modelOutput,
                  })
                    .then((sRes) => {
                      if (sRes.data.success) setSummary(sRes.data.data.summary);
                    })
                    .catch(() =>
                      setSummary("AI Explanation temporarily unavailable."),
                    );
                }
              }
            } else {
              setError("Uploaded file contins no recognizable inverter data.");
            }
          }
        } catch (err) {
          console.error("Error parsing file:", err);
          setError(
            "Failed to parse the file. Ensure it is a valid CSV or Excel document.",
          );
        } finally {
          setLoading(false);
          // Reset file input so user can upload same file again if needed
          e.target.value = "";
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Failed to load SheetJS from CDN", err);
      setError("Failed to load document parsing library over the network.");
      setLoading(false);
    }
  };

  const handleScheduleInspection = async () => {
    if (!id) return;
    setInspectionLoading(true);
    setInspectionMessage({ text: "", type: "" });

    try {
      const riskScore = prediction ? prediction.riskScore : null;
      const res = await scheduleInspection({ inverterId: id, riskScore });

      if (res.data.success) {
        setInspectionMessage({ text: res.data.message, type: "success" });
      } else {
        setInspectionMessage({
          text: res.data.message || "Failed to schedule inspection.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setInspectionMessage({
        text: err.response?.data?.message || "Error communicating with server.",
        type: "error",
      });
    } finally {
      setInspectionLoading(false);

      // Clear message after 5 seconds
      setTimeout(() => {
        setInspectionMessage({ text: "", type: "" });
      }, 5000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            flex: 1,
            maxWidth: "480px",
          }}
        >
          {availableInverters.length > 0 && (
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <select
                value={
                  availableInverters.includes(searchInput) ? searchInput : ""
                }
                onChange={(e) => {
                  if (e.target.value) setSearchInput(e.target.value);
                }}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-sub-surface)",
                  color: "var(--text-primary)",
                  flex: 1,
                  fontSize: "0.9rem",
                }}
              >
                <option value="">— Select from dataset —</option>
                {availableInverters.map((inv) => (
                  <option key={inv} value={inv}>
                    {inv}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Or type Inverter ID (e.g. INV-1, plant_1_inv_3)"
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-sub-surface)",
                color: "var(--text-primary)",
                flex: 1,
                fontSize: "0.9rem",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0.6rem 1.2rem",
                backgroundColor: "var(--accent-primary)",
                color: "#000",
                fontWeight: "bold",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Load
            </button>
          </div>
        </form>
      </div>

      <header
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Inverter: {currentInverterId}</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Status:{" "}
            {prediction ? (
              <span
                style={{
                  color:
                    prediction.riskScore >= 70
                      ? "var(--status-high-risk)"
                      : prediction.riskScore >= 40
                        ? "var(--status-medium-risk)"
                        : "var(--status-low-risk)",
                  fontWeight: "bold",
                }}
              >
                Predicted Risk ({prediction.riskScore}%)
              </span>
            ) : id ? (
              "Awaiting Telemetry"
            ) : (
              "No Inverter Selected"
            )}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={handleScheduleInspection}
            disabled={!id || inspectionLoading}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--bg-sub-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              opacity: !id || inspectionLoading ? 0.5 : 1,
              cursor: !id || inspectionLoading ? "not-allowed" : "pointer",
            }}
          >
            {inspectionLoading ? "Scheduling..." : "Schedule Inspection"}
          </button>
          {inspectionMessage.text && (
            <span
              style={{
                fontSize: "0.85rem",
                color:
                  inspectionMessage.type === "success"
                    ? "var(--status-low-risk)"
                    : "var(--status-high-risk)",
              }}
            >
              {inspectionMessage.text}
            </span>
          )}
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {historyData.length > 0 && (
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>
              Recent Performance History
            </h3>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <LineChart
                  data={historyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="datetime"
                    stroke="var(--text-secondary)"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    tickFormatter={(val) => {
                      // Extract time from '2022-04-11 15:30:00'
                      try {
                        return val.split(" ")[1].substring(0, 5);
                      } catch (e) {
                        return val;
                      }
                    }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--text-secondary)"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--text-secondary)"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-color)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "var(--text-primary)" }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    name="Inverter Power"
                    dataKey="inverter_power"
                    stroke="var(--accent-primary)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="Energy Today"
                    dataKey="energy_today"
                    stroke="var(--status-medium-risk)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Manual Telemetry Input for Prediction Simulation */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ margin: 0, color: "var(--accent-secondary)" }}>
              Submit Telemetry for Prediction
            </h3>
          </div>

          <div
            style={{
              padding: "1rem",
              backgroundColor: "var(--bg-main)",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              border: "1px dashed var(--border-color)",
            }}
          >
            <h4
              style={{
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
                color: "var(--text-secondary)",
              }}
            >
              Auto-fill from Dataset
            </h4>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "0.8rem",
              }}
            >
              Upload a CSV or Excel file containing system data. The first row
              will be used to populate the telemetry fields below.
            </p>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleDatasetUpload}
              disabled={loading || !id}
              style={{ width: "100%", fontSize: "0.85rem" }}
            />
          </div>

          <form
            onSubmit={handlePredict}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {models.length > 0 && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Model to use
                </label>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-sub-surface)",
                    color: "var(--text-primary)",
                  }}
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.active ? "(Active default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Inverter ID for this prediction */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  marginBottom: "0.5rem",
                }}
              >
                Inverter ID{" "}
                <span
                  style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                >
                  (used in prediction payload)
                </span>
              </label>
              {availableInverters.length > 0 && (
                <select
                  value={
                    availableInverters.includes(predictionInverterId)
                      ? predictionInverterId
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) setPredictionInverterId(e.target.value);
                  }}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-sub-surface)",
                    color: "var(--text-primary)",
                    marginBottom: "0.4rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <option value="">— Select from dataset —</option>
                  {availableInverters.map((inv) => (
                    <option key={inv} value={inv}>
                      {inv}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={predictionInverterId}
                onChange={(e) => setPredictionInverterId(e.target.value)}
                placeholder="Type Inverter ID (e.g. inv-1, plant_1_inv_3)"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "8px",
                  border: "1px solid var(--accent-primary)",
                  backgroundColor: "var(--bg-sub-surface)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {Object.keys(telemetry)
              .filter(
                (key) =>
                  !key.endsWith("_rolling_mean") &&
                  !key.endsWith("_diff") &&
                  !key.endsWith("_std") &&
                  key !== "failure_label",
              )
              .map((key) => (
                <div key={key}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.3rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={key}
                  >
                    {key.replace(/_/g, " ")}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name={key}
                    value={telemetry[key]}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-sub-surface)",
                      color: "var(--text-primary)",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              ))}

            <button
              type="submit"
              disabled={loading || !id}
              style={{
                padding: "1rem",
                marginTop: "1rem",
                backgroundColor: "var(--accent-primary)",
                color: "#000",
                fontWeight: "bold",
                borderRadius: "8px",
                border: "none",
                cursor: loading || !id ? "not-allowed" : "pointer",
                opacity: loading || !id ? 0.7 : 1,
              }}
            >
              {loading ? "Analyzing Telemetry via ML..." : "Run Diagnostics"}
            </button>
            {error && (
              <p
                style={{
                  color: "var(--status-high-risk)",
                  fontSize: "0.9rem",
                  marginTop: "0.5rem",
                }}
              >
                {error}
              </p>
            )}
          </form>
        </div>

        {/* AI Explanation Result */}
        <div>
          <div
            className="card"
            style={{
              border: prediction
                ? `1px solid ${prediction.riskScore >= 70 ? "var(--status-high-risk)" : "var(--accent-primary)"}`
                : "1px solid var(--border-color)",
              backgroundColor: prediction
                ? "rgba(0, 229, 255, 0.05)"
                : "var(--bg-sub-surface)",
              minHeight: "100%",
            }}
          >
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: prediction
                  ? "var(--accent-primary)"
                  : "var(--text-secondary)",
              }}
            >
              AI Explanation Panel
            </h3>

            {!prediction && !loading && (
              <p
                style={{
                  marginTop: "2rem",
                  color: "var(--text-secondary)",
                  textAlign: "center",
                }}
              >
                Submit telemetry data to generate an AI risk analysis.
              </p>
            )}

            {loading && (
              <div style={{ marginTop: "2rem" }}>
                <div
                  className="skeleton"
                  style={{
                    width: "100%",
                    height: "20px",
                    marginBottom: "0.5rem",
                  }}
                ></div>
                <div
                  className="skeleton"
                  style={{ width: "80%", height: "20px", marginBottom: "2rem" }}
                ></div>
                <div
                  className="skeleton"
                  style={{
                    width: "60%",
                    height: "15px",
                    marginBottom: "0.5rem",
                  }}
                ></div>
                <div
                  className="skeleton"
                  style={{ width: "50%", height: "15px" }}
                ></div>
              </div>
            )}

            {prediction && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "var(--bg-main)",
                    borderRadius: "8px",
                    marginTop: "1.5rem",
                    borderLeft: `4px solid ${prediction.riskScore >= 70 ? "var(--status-high-risk)" : "var(--status-low-risk)"}`,
                  }}
                >
                  <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    Generative Root Cause Analysis:
                  </h4>
                  <p
                    style={{ color: "var(--text-primary)", lineHeight: "1.5" }}
                  >
                    {summary || "Generating summary..."}
                  </p>
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <h4
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Top Contributing Factors (SHAP):
                  </h4>
                  {prediction.topFeatures &&
                  prediction.topFeatures.length > 0 ? (
                    <ul
                      style={{
                        paddingLeft: "1.5rem",
                        color: "var(--text-primary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {prediction.topFeatures.map((feat, idx) => (
                        <li key={idx}>
                          <span style={{ fontWeight: "500" }}>{feat.name}</span>
                          <span
                            style={{
                              color:
                                feat.value > 0
                                  ? "var(--status-high-risk)"
                                  : "var(--status-low-risk)",
                              marginLeft: "0.5rem",
                            }}
                          >
                            ({feat.value > 0 ? "+" : ""}
                            {feat.value})
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
                    >
                      No significant factors identified.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {batchPredictions.length > 1 && (
        <div style={{ marginTop: "2rem" }} className="card">
          <h3
            style={{ marginBottom: "1rem", color: "var(--accent-secondary)" }}
          >
            Batch Prediction Results
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th
                    style={{
                      padding: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Inverter ID
                  </th>
                  <th
                    style={{
                      padding: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Risk Score
                  </th>
                  <th
                    style={{
                      padding: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Risk Level
                  </th>
                  <th
                    style={{
                      padding: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Top Factor
                  </th>
                </tr>
              </thead>
              <tbody>
                {batchPredictions.map((pred) => (
                  <tr
                    key={pred._id || pred.inverterId}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <td
                      style={{
                        padding: "0.8rem",
                        color: "var(--text-primary)",
                        fontWeight: "bold",
                      }}
                    >
                      {pred.inverterId}
                    </td>
                    <td
                      style={{
                        padding: "0.8rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {pred.riskScore}%
                    </td>
                    <td
                      style={{
                        padding: "0.8rem",
                        color:
                          pred.riskScore >= 70
                            ? "var(--status-high-risk)"
                            : pred.riskScore >= 40
                              ? "var(--status-medium-risk)"
                              : "var(--status-low-risk)",
                        fontWeight: "bold",
                      }}
                    >
                      {pred.riskScore >= 70
                        ? "High Risk"
                        : pred.riskScore >= 40
                          ? "Medium Risk"
                          : "Low Risk"}
                    </td>
                    <td
                      style={{
                        padding: "0.8rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {pred.topFeatures && pred.topFeatures.length > 0
                        ? `${pred.topFeatures[0].name} (+${pred.topFeatures[0].value.toFixed(2)})`
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InverterDetail;
