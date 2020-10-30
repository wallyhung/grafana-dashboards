import { omit } from 'lodash';
import { Databases } from 'shared/core';
import { apiRequestManagement } from 'shared/components/helpers/api';
import { Kubernetes } from '../Kubernetes/Kubernetes.types';
import {
  XtraDBCluster,
  XtraDBClusterPayload,
  DeleteXtraDBClusterAPI,
  XtraDBClusterConnectionAPI,
} from './XtraDB.types';
import { DBClusterService } from './DBCluster.service';

export class XtraDBService extends DBClusterService {
  getDBClusters(kubernetes: Kubernetes): Promise<XtraDBClusterPayload> {
    return apiRequestManagement.post<any, Kubernetes>('/DBaaS/XtraDBClusters/List', kubernetes);
  }

  addDBCluster(xtradbCluster: XtraDBCluster): Promise<void | XtraDBClusterPayload> {
    return apiRequestManagement.post<XtraDBClusterPayload, any>(
      '/DBaaS/XtraDBCluster/Create',
      toAPI(xtradbCluster),
    );
  }

  deleteDBClusters(xtradbCluster: XtraDBCluster): Promise<void> {
    const toAPI = (cluster: XtraDBCluster): DeleteXtraDBClusterAPI => ({
      name: cluster.clusterName,
      kubernetes_cluster_name: xtradbCluster.kubernetesClusterName,
    });

    return apiRequestManagement.post<any, DeleteXtraDBClusterAPI>(
      '/DBaaS/XtraDBCluster/Delete',
      toAPI(xtradbCluster),
    );
  }

  getDBCluster(xtradbCluster: XtraDBCluster): Promise<void | XtraDBClusterConnectionAPI> {
    return apiRequestManagement.post<XtraDBClusterConnectionAPI, any>(
      '/DBaaS/XtraDBClusters/Get',
      omit(toAPI(xtradbCluster), ['params']),
    );
  }

  toModel(
    xtradbCluster: XtraDBClusterPayload,
    kubernetesClusterName: string,
    databaseType: Databases,
  ): XtraDBCluster {
    return {
      clusterName: xtradbCluster.name,
      kubernetesClusterName,
      databaseType,
      clusterSize: xtradbCluster.params.cluster_size,
      memory: xtradbCluster.params.pxc?.compute_resources?.memory_bytes || 0,
      cpu: xtradbCluster.params.pxc?.compute_resources?.cpu_m || 0,
      status: xtradbCluster.state,
      errorMessage: xtradbCluster.operation?.message,
    };
  }
}

const toAPI = (xtradbCluster: XtraDBCluster): XtraDBClusterPayload => ({
  kubernetes_cluster_name: xtradbCluster.kubernetesClusterName,
  name: xtradbCluster.clusterName,
  params: {
    cluster_size: xtradbCluster.clusterSize,
    pxc: {
      compute_resources: {
        cpu_m: xtradbCluster.cpu * 1000,
        memory_bytes: xtradbCluster.memory * 10 ** 9,
      },
    },
    proxysql: {
      compute_resources: {
        cpu_m: 0,
        memory_bytes: 0,
      },
    },
  },
});
