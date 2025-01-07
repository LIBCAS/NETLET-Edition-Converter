/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package cz.knav.netlet.netleteditor.alto;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.annotation.JSONField;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 *
 * @author alberto
 */
public class AltoPrintSpace {

  public int HPOS;
  public int VPOS;
  public int WIDTH;
  public int HEIGHT;

  public List<AltoBlock> TextBlock = new ArrayList();
  @JSONField(name = "TextBlock")
  public void setTextBlock(Object TextBlock) {
    if (TextBlock instanceof AltoBlock[]) {
      List<AltoBlock> statesArray = (List<AltoBlock>) TextBlock;
      this.TextBlock = statesArray;
    } else if (TextBlock instanceof com.alibaba.fastjson2.JSONArray) {
      this.TextBlock = (List<AltoBlock>)JSON.parseArray(TextBlock.toString(), AltoBlock.class);
    } else if (TextBlock instanceof com.alibaba.fastjson2.JSONObject) {
      AltoBlock ab =(AltoBlock)JSON.parseObject(TextBlock.toString(), AltoBlock.class);
      this.TextBlock = Arrays.asList(new AltoBlock[]{ab});
    } else {
      this.TextBlock = new ArrayList();
    }
  }
}
