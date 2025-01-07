/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package cz.knav.netlet.netleteditor.alto;

import com.alibaba.fastjson2.JSON;
import java.util.List;
import org.apache.solr.client.solrj.beans.Field;

/**
 *
 * @author alberto
 */
public class AltoLine {

  @Field
  public int HPOS;
  
  @Field
  public int VPOS;
  
  @Field
  public int WIDTH;
  
  @Field
  public int HEIGHT;
  
  @Field
  public int BASELINE;
  
  @Field
  public List<AltoSP> SP;

//  @JSONField(name = "SP")
//  public void setSP(Object value) {
//
//    if (value instanceof AltoSP[]) {
//      List<AltoSP> statesArray = (List<AltoSP>) value;
//      this.SP = statesArray;
//    } else if (value instanceof com.alibaba.fastjson2.JSONArray) {
//      this.SP = (List<AltoSP>) JSON.parseArray(value.toString(), AltoSP.class);
//    } else if (value instanceof com.alibaba.fastjson2.JSONObject) {
//      AltoSP ab = (AltoSP) JSON.parseObject(value.toString(), AltoSP.class);
//      this.SP = Arrays.asList(new AltoSP[]{ab});
//
//    } else {
//      this.SP = new ArrayList();
//    }
//  }

  public List<AltoString> String;

//  @JSONField(name = "String")
//  public void setString(Object value) {
//
//    if (value instanceof AltoString[]) {
//      List<AltoString> statesArray = (List<AltoString>) value;
//      this.String = statesArray;
//    } else if (value instanceof com.alibaba.fastjson2.JSONArray) {
//      this.String = (List<AltoString>) JSON.parseArray(value.toString(), AltoString.class);
//    } else if (value instanceof com.alibaba.fastjson2.JSONObject) {
//      AltoString ab = (AltoString) JSON.parseObject(value.toString(), AltoString.class);
//      this.String = Arrays.asList(new AltoString[]{ab});
//
//    } else {
//      this.String = new ArrayList();
//    }
//  }
  
  public String getTextContent() {
    String s = "";
    for (AltoString as: String) {
      s += as.CONTENT + " ";
    }
    return s;
  }
  
  @Override
  public String toString() {
    String s = JSON.toJSONString(this);
    return s;
  }
}
