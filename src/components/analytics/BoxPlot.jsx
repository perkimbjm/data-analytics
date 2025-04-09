import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const BoxPlot = ({ data, columnName }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || !Array.isArray(data.values)) {
      console.error("❌ Data boxplot tidak valid atau kosong!", data);
      return;
    }

    const width = 800, height = 450;
    const margin = { top: 40, right: 60, bottom: 60, left: 80 };

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("cursor", "grab") // Cursor default
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand()
      .domain([columnName])
      .range([0, width - margin.left - margin.right])
      .padding(0.6);

      const yPadding = (data.max - data.min) * 0.2; // Beri jarak 20% dari rentang data
      const yScale = d3.scaleLinear()
        .domain([data.min - yPadding, data.max + yPadding]) // Skala otomatis
        .nice()
        .range([height - margin.top - margin.bottom, 0]);

    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.8)")
      .style("color", "#fff")
      .style("padding", "10px")
      .style("border-radius", "6px")
      .style("box-shadow", "0 4px 8px rgba(255,255,255,0.2)")
      .style("display", "none");

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 6])
      .translateExtent([[-100, -100], [width + 100, height + 100]]) // Perbaikan panning
      .on("start", () => svg.style("cursor", "grabbing"))
      .on("end", () => svg.style("cursor", "grab"))
      .on("zoom", (event) => svg.attr("transform", event.transform));

    d3.select(svgRef.current).call(zoom);

    // Sumbu X
    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("fill", "#fff");

    // Sumbu Y
    svg.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("fill", "#fff");

    const x = xScale(columnName) + xScale.bandwidth() / 2;

    // Garis Whiskers
    svg.append("line")
      .attr("x1", x)
      .attr("x2", x)
      .attr("y1", yScale(data.min))
      .attr("y2", yScale(data.max))
      .attr("stroke", "#aaa")
      .attr("stroke-width", 4)
      .transition()
      .duration(800)
      .attr("stroke-width", 6);

    // Kotak Box
    svg.append("rect")
      .attr("x", x - 50)
      .attr("y", yScale(data.q3))
      .attr("width", 100)
      .attr("height", yScale(data.q1) - yScale(data.q3))
      .attr("fill", "#3498db")
      .attr("stroke", "#fff")
      .attr("rx", 8)
      .attr("opacity", 0.85)
      .on("mouseover", function (event) {
        d3.select(this).transition().duration(200).attr("fill", "#5dade2");
        tooltip.style("display", "block").html(`Q1: ${data.q1}<br>Q3: ${data.q3}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("fill", "#3498db");
        tooltip.style("display", "none");
      });

    // Garis Median
    svg.append("line")
      .attr("x1", x - 50)
      .attr("x2", x + 50)
      .attr("y1", yScale(data.median))
      .attr("y2", yScale(data.median))
      .attr("stroke", "yellow")
      .attr("stroke-width", 4)
      .on("mouseover", () => tooltip.style("display", "block").html(`Median: ${data.median}`))
      .on("mousemove", (event) => {
        tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", () => tooltip.style("display", "none"));

    // Titik Outliers dengan warna berbeda & efek glow
    if (data.outliers.length > 0) {
      svg.selectAll(".outlier")
        .data(data.outliers)
        .enter()
        .append("circle")
        .attr("cx", x)
        .attr("cy", d => yScale(d))
        .attr("r", 6)
        .attr("fill", (d, i) => (i % 2 === 0 ? "red" : "lime")) // Warna bervariasi
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("filter", "drop-shadow(0 0 12px rgba(255,255,0,0.9))")
        .on("mouseover", function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", 9);
          tooltip.style("display", "block").html(`<strong>Outlier:</strong> ${d}`);
        })
        .on("mousemove", (event) => {
          tooltip.style("left", `${event.pageX + 12}px`).style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("r", 6);
          tooltip.style("display", "none");
        });
    }

  }, [data, columnName]);

  return (
    <svg ref={svgRef} style={{ backgroundColor: "#111", borderRadius: "12px", padding: "10px" }} />
  );
};

export default BoxPlot;
