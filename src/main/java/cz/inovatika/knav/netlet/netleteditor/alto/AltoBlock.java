
package cz.inovatika.knav.netlet.netleteditor.alto;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.annotation.JSONField;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.apache.solr.client.solrj.beans.Field;
import org.json.JSONObject;

/**
 *
 * @author alberto
 */
public class AltoBlock {
  
  @Field
  public int HPOS;
  
  @Field
  public int VPOS;
  
  @Field
  public int WIDTH;
  
  @Field
  public int HEIGHT;
  
  public String ID;
  
  public List<AltoLine> TextLine = new ArrayList();
}
